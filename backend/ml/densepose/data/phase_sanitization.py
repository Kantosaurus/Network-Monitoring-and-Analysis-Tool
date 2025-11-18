"""
Phase Sanitization for WiFi CSI Signals

Implements the phase cleaning pipeline from the paper (Section 3.1)
with enhanced Kalman filtering for better temporal consistency.

Reference: "DensePose From WiFi" Section 3.1
"""

import numpy as np
from scipy import signal
from typing import Tuple


class PhaseSanitizer:
    """
    Advanced phase sanitization for WiFi CSI signals

    Pipeline:
    1. Phase unwrapping (removes discontinuities)
    2. Median + Uniform filtering (removes outliers)
    3. Kalman filtering (temporal smoothing - enhancement)
    4. Linear fitting (removes time-of-flight effects)
    """

    def __init__(self, median_kernel_size: int = 3, uniform_kernel_size: int = 3):
        """
        Args:
            median_kernel_size: Kernel size for median filter
            uniform_kernel_size: Kernel size for uniform filter
        """
        self.median_kernel_size = median_kernel_size
        self.uniform_kernel_size = uniform_kernel_size

    def unwrap_phase(self, phase: np.ndarray) -> np.ndarray:
        """
        Unwrap phase discontinuities

        Implements Equation (1) from paper:
        if Δφ_{i,j} > π, φ_{i,j+1} = φ_{i,j} + Δφ_{i,j} - 2π
        if Δφ_{i,j} < -π, φ_{i,j+1} = φ_{i,j} + Δφ_{i,j} + 2π

        Args:
            phase: (num_samples, num_frequencies) phase values

        Returns:
            unwrapped_phase: Continuous phase values
        """
        unwrapped = phase.copy()
        num_samples, num_frequencies = phase.shape

        for i in range(num_samples):
            for j in range(num_frequencies - 1):
                delta_phi = unwrapped[i, j + 1] - unwrapped[i, j]

                if delta_phi > np.pi:
                    unwrapped[i, j + 1] = unwrapped[i, j] + delta_phi - 2 * np.pi
                elif delta_phi < -np.pi:
                    unwrapped[i, j + 1] = unwrapped[i, j] + delta_phi + 2 * np.pi

        return unwrapped

    def apply_filters(self, phase: np.ndarray) -> np.ndarray:
        """
        Apply median and uniform filters to eliminate outliers

        This removes jittering in both time and frequency domains.

        Args:
            phase: (num_samples, num_frequencies) unwrapped phase

        Returns:
            filtered_phase: Filtered phase values
        """
        # Time domain filtering (across samples)
        filtered = signal.medfilt(phase, kernel_size=(self.median_kernel_size, 1))

        # Frequency domain filtering (across subcarriers)
        filtered = signal.medfilt(filtered, kernel_size=(1, self.median_kernel_size))

        # Uniform filtering for additional smoothing
        filtered = signal.convolve2d(
            filtered,
            np.ones((self.uniform_kernel_size, self.uniform_kernel_size)) /
            (self.uniform_kernel_size ** 2),
            mode='same',
            boundary='symm'
        )

        return filtered

    def kalman_filter(self, phase: np.ndarray) -> np.ndarray:
        """
        Apply Kalman filter for temporal smoothing (enhancement)

        This is an enhancement beyond the paper's approach.
        Kalman filtering provides better temporal consistency.

        Args:
            phase: (num_samples, num_frequencies) filtered phase

        Returns:
            smoothed_phase: Temporally smoothed phase
        """
        num_samples, num_frequencies = phase.shape
        smoothed = np.zeros_like(phase)

        # Kalman filter parameters
        process_variance = 1e-5  # Q
        measurement_variance = 1e-2  # R

        for freq_idx in range(num_frequencies):
            # Initialize
            x_est = phase[0, freq_idx]  # Initial state estimate
            p_est = 1.0  # Initial error covariance

            smoothed[0, freq_idx] = x_est

            # Kalman filtering
            for t in range(1, num_samples):
                # Prediction
                x_pred = x_est
                p_pred = p_est + process_variance

                # Update
                kalman_gain = p_pred / (p_pred + measurement_variance)
                x_est = x_pred + kalman_gain * (phase[t, freq_idx] - x_pred)
                p_est = (1 - kalman_gain) * p_pred

                smoothed[t, freq_idx] = x_est

        return smoothed

    def linear_fit(self, phase: np.ndarray) -> np.ndarray:
        """
        Apply linear fitting to remove time-of-flight effects

        Implements Equation (2) from paper:
        α₁ = (Φ_F - Φ_1) / (2πF)
        α₀ = (1/F) * Σ φ_f
        φ̂_f = φ_f - (α₁*f + α₀)

        Args:
            phase: (num_samples, num_frequencies) smoothed phase

        Returns:
            fitted_phase: Phase with ToF effects removed
        """
        num_samples, num_frequencies = phase.shape
        fitted = np.zeros_like(phase)

        for i in range(num_samples):
            # Calculate slope (α₁)
            phi_1 = phase[i, 0]
            phi_F = phase[i, -1]
            alpha_1 = (phi_F - phi_1) / (2 * np.pi * num_frequencies)

            # Calculate intercept (α₀)
            alpha_0 = np.mean(phase[i, :])

            # Remove linear trend
            for f in range(num_frequencies):
                fitted[i, f] = phase[i, f] - (alpha_1 * f + alpha_0)

        return fitted

    def sanitize(self, csi_complex: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Complete sanitization pipeline

        Args:
            csi_complex: (num_samples, num_frequencies, num_tx, num_rx) complex CSI

        Returns:
            amplitude: (num_samples, num_frequencies, num_tx, num_rx) amplitude
            phase: (num_samples, num_frequencies, num_tx, num_rx) sanitized phase
        """
        num_samples, num_frequencies, num_tx, num_rx = csi_complex.shape

        # Extract amplitude and phase
        amplitude = np.abs(csi_complex)
        raw_phase = np.angle(csi_complex)

        # Sanitize phase for each antenna pair
        sanitized_phase = np.zeros_like(raw_phase)

        for tx in range(num_tx):
            for rx in range(num_rx):
                phase_2d = raw_phase[:, :, tx, rx]  # (num_samples, num_frequencies)

                # Step 1: Unwrap phase
                unwrapped = self.unwrap_phase(phase_2d)

                # Step 2: Apply median and uniform filters
                filtered = self.apply_filters(unwrapped)

                # Step 3: Kalman filter (enhancement)
                smoothed = self.kalman_filter(filtered)

                # Step 4: Linear fit
                fitted = self.linear_fit(smoothed)

                sanitized_phase[:, :, tx, rx] = fitted

        return amplitude, sanitized_phase

    def visualize_sanitization(self, raw_phase: np.ndarray, sanitized_phase: np.ndarray,
                              tx: int = 0, rx: int = 0):
        """
        Visualize the sanitization process (for debugging)

        Args:
            raw_phase: Raw phase values
            sanitized_phase: Sanitized phase values
            tx: Transmitter antenna index
            rx: Receiver antenna index
        """
        import matplotlib.pyplot as plt

        fig, axes = plt.subplots(2, 1, figsize=(12, 8))

        # Plot raw phase
        axes[0].set_title(f'Raw Phase (TX{tx}-RX{rx})')
        for sample in range(min(5, raw_phase.shape[0])):
            axes[0].plot(raw_phase[sample, :, tx, rx], label=f'Sample {sample}')
        axes[0].set_xlabel('Subcarrier Index')
        axes[0].set_ylabel('Phase (radians)')
        axes[0].legend()
        axes[0].grid(True)

        # Plot sanitized phase
        axes[1].set_title(f'Sanitized Phase (TX{tx}-RX{rx})')
        for sample in range(min(5, sanitized_phase.shape[0])):
            axes[1].plot(sanitized_phase[sample, :, tx, rx], label=f'Sample {sample}')
        axes[1].set_xlabel('Subcarrier Index')
        axes[1].set_ylabel('Phase (radians)')
        axes[1].legend()
        axes[1].grid(True)

        plt.tight_layout()
        plt.show()


# Utility function
def sanitize_csi_batch(csi_complex_batch: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """
    Sanitize a batch of CSI samples

    Args:
        csi_complex_batch: (batch_size, num_samples, num_frequencies, num_tx, num_rx)

    Returns:
        amplitude_batch: Amplitude values
        phase_batch: Sanitized phase values
    """
    sanitizer = PhaseSanitizer()
    batch_size = csi_complex_batch.shape[0]

    amplitude_list = []
    phase_list = []

    for i in range(batch_size):
        amplitude, phase = sanitizer.sanitize(csi_complex_batch[i])
        amplitude_list.append(amplitude)
        phase_list.append(phase)

    return np.stack(amplitude_list), np.stack(phase_list)
