"""
Loss Functions for WiFi-DensePose Training

Implements the combined loss from the paper:
L = L_cls + L_box + λ_dp*L_dp + λ_kp*L_kp + λ_tr*L_tr
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Optional


class DensePoseLoss(nn.Module):
    """
    Combined loss for WiFi-DensePose training

    Components:
    1. Classification loss (person/background)
    2. Bounding box regression loss
    3. DensePose loss (segmentation + UV regression)
    4. Keypoint loss (heatmap cross-entropy)
    5. Transfer learning loss (optional)
    """

    def __init__(
        self,
        lambda_dp: float = 0.6,
        lambda_kp: float = 0.3,
        lambda_tr: float = 0.1
    ):
        super().__init__()
        self.lambda_dp = lambda_dp
        self.lambda_kp = lambda_kp
        self.lambda_tr = lambda_tr

    def forward(
        self,
        predictions: Dict,
        densepose_gt: Dict,
        keypoints_gt: torch.Tensor,
        bboxes_gt: torch.Tensor,
        teacher_features: Optional[Dict] = None
    ) -> Dict[str, torch.Tensor]:
        """
        Compute combined loss

        Args:
            predictions: Model predictions dict with 'densepose' and 'keypoints'
            densepose_gt: Ground truth dict with 'segmentation' and 'uv_coords'
            keypoints_gt: Ground truth keypoint heatmaps (B, 17, 56, 56)
            bboxes_gt: Ground truth bounding boxes (B, N, 4)
            teacher_features: Optional teacher network features for transfer learning

        Returns:
            Dict with individual losses and total loss
        """
        losses = {}

        # 1. DensePose Loss
        dp_loss = self.compute_densepose_loss(
            predictions['densepose'],
            densepose_gt
        )
        losses['densepose_loss'] = dp_loss

        # 2. Keypoint Loss
        kp_loss = self.compute_keypoint_loss(
            predictions['keypoints'],
            keypoints_gt
        )
        losses['keypoint_loss'] = kp_loss

        # 3. Transfer Learning Loss (if teacher features provided)
        if teacher_features is not None:
            tr_loss = self.compute_transfer_loss(
                predictions.get('backbone_features'),
                teacher_features
            )
            losses['transfer_loss'] = tr_loss
        else:
            losses['transfer_loss'] = torch.tensor(0.0, device=dp_loss.device)

        # Total loss
        total_loss = (
            self.lambda_dp * losses['densepose_loss'] +
            self.lambda_kp * losses['keypoint_loss'] +
            self.lambda_tr * losses['transfer_loss']
        )

        losses['total_loss'] = total_loss

        return losses

    def compute_densepose_loss(
        self,
        predictions: Dict,
        targets: Dict
    ) -> torch.Tensor:
        """
        Compute DensePose loss

        Loss components:
        1. Body part segmentation (cross-entropy)
        2. UV coordinate regression (smooth L1)

        Args:
            predictions: Dict with 'segmentation' and 'uv_coords'
            targets: Ground truth dict

        Returns:
            DensePose loss
        """
        # 1. Segmentation loss (25 classes: 24 parts + background)
        pred_seg = predictions['segmentation']  # (B, 25, H, W)
        target_seg = targets['segmentation']    # (B, 25, H, W)

        seg_loss = F.cross_entropy(
            pred_seg,
            target_seg.argmax(dim=1),  # Convert one-hot to class indices
            reduction='mean'
        )

        # 2. UV regression loss (smooth L1)
        pred_uv = predictions['uv_coords']  # (B, 24, 2, H, W)
        target_uv = targets['uv_coords']    # (B, 24, 2, H, W)

        # Only compute loss on foreground pixels
        # Get foreground mask (all parts except background)
        fg_mask = target_seg[:, 1:].sum(dim=1, keepdim=True) > 0.5  # (B, 1, H, W)
        fg_mask = fg_mask.unsqueeze(2)  # (B, 1, 1, H, W)

        # Apply mask and compute smooth L1 loss
        pred_uv_masked = pred_uv * fg_mask
        target_uv_masked = target_uv * fg_mask

        uv_loss = F.smooth_l1_loss(pred_uv_masked, target_uv_masked, reduction='mean')

        # Combine losses
        total_loss = seg_loss + uv_loss

        return total_loss

    def compute_keypoint_loss(
        self,
        predictions: torch.Tensor,
        targets: torch.Tensor
    ) -> torch.Tensor:
        """
        Compute keypoint heatmap loss

        Args:
            predictions: Predicted heatmaps (B, 17, 56, 56)
            targets: Ground truth heatmaps (B, 17, 56, 56)

        Returns:
            Keypoint loss
        """
        # Cross-entropy loss for each keypoint
        # Flatten spatial dimensions
        B, K, H, W = predictions.shape

        pred_flat = predictions.view(B, K, -1)  # (B, 17, 56*56)
        target_flat = targets.view(B, K, -1)    # (B, 17, 56*56)

        # Apply softmax and compute negative log likelihood
        pred_prob = F.log_softmax(pred_flat, dim=-1)

        # Weighted cross-entropy (higher weight for keypoint locations)
        loss = -torch.sum(target_flat * pred_prob, dim=-1).mean()

        return loss

    def compute_transfer_loss(
        self,
        student_features: Optional[Dict],
        teacher_features: Dict
    ) -> torch.Tensor:
        """
        Compute transfer learning loss (feature matching)

        Matches multi-level feature maps from student to teacher:
        L_tr = MSE(P2, P2*) + MSE(P3, P3*) + MSE(P4, P4*) + MSE(P5, P5*)

        Args:
            student_features: Student network features
            teacher_features: Teacher network features

        Returns:
            Transfer learning loss
        """
        if student_features is None:
            return torch.tensor(0.0)

        total_loss = 0.0
        num_levels = 0

        # Match features at multiple scales
        for level in ['P2', 'P3', 'P4', 'P5']:
            if level in student_features and level in teacher_features:
                student_feat = student_features[level]
                teacher_feat = teacher_features[level]

                # MSE loss
                loss = F.mse_loss(student_feat, teacher_feat, reduction='mean')
                total_loss += loss
                num_levels += 1

        if num_levels > 0:
            total_loss /= num_levels

        return total_loss


# Smooth L1 Loss (used in bounding box regression)
def smooth_l1_loss(input: torch.Tensor, target: torch.Tensor, beta: float = 1.0) -> torch.Tensor:
    """
    Smooth L1 loss (used in Faster R-CNN)

    Args:
        input: Predicted values
        target: Target values
        beta: Smoothness parameter

    Returns:
        Smooth L1 loss
    """
    diff = torch.abs(input - target)
    loss = torch.where(
        diff < beta,
        0.5 * diff ** 2 / beta,
        diff - 0.5 * beta
    )
    return loss.mean()
