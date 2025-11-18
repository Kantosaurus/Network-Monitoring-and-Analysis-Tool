"""
Checkpoint utilities for saving and loading model weights
"""

import torch
import os
from typing import Dict, Any, Optional


def save_checkpoint(
    model: torch.nn.Module,
    optimizer: torch.optim.Optimizer,
    scheduler: Any,
    iteration: int,
    epoch: int,
    best_val_loss: float,
    config: Any,
    path: str
) -> None:
    """
    Save training checkpoint

    Args:
        model: Model to save
        optimizer: Optimizer state
        scheduler: Learning rate scheduler
        iteration: Current iteration
        epoch: Current epoch
        best_val_loss: Best validation loss so far
        config: Model configuration
        path: Path to save checkpoint
    """
    # Handle DataParallel/DistributedDataParallel
    if hasattr(model, 'module'):
        model_state = model.module.state_dict()
    else:
        model_state = model.state_dict()

    checkpoint = {
        'model_state_dict': model_state,
        'optimizer_state_dict': optimizer.state_dict(),
        'scheduler_state_dict': scheduler.state_dict(),
        'iteration': iteration,
        'epoch': epoch,
        'best_val_loss': best_val_loss,
        'config': config.to_dict() if hasattr(config, 'to_dict') else config
    }

    torch.save(checkpoint, path)


def load_checkpoint(path: str, device: str = 'cpu') -> Dict[str, Any]:
    """
    Load training checkpoint

    Args:
        path: Path to checkpoint
        device: Device to load checkpoint to

    Returns:
        Checkpoint dictionary
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"Checkpoint not found: {path}")

    checkpoint = torch.load(path, map_location=device)
    return checkpoint
