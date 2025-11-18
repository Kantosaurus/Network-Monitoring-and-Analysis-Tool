"""
Setup script for WiFi-DensePose package
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="wifi-densepose",
    version="1.0.0",
    author="NMAT Team",
    description="Dense Human Pose Estimation from WiFi Signals",
    long_description=long_description,
    long_description_content_type="text/markdown",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
    ],
    python_requires=">=3.8",
    install_requires=[
        "torch>=2.1.0",
        "torchvision>=0.16.0",
        "numpy>=1.24.0",
        "scipy>=1.11.0",
        "opencv-python>=4.8.0",
        "pillow>=10.0.0",
        "matplotlib>=3.8.0",
        "tensorboard>=2.15.0",
        "tqdm>=4.66.0",
        "einops>=0.7.0",
        "timm>=0.9.0",
        "albumentations>=1.3.0",
        "flask>=3.0.0",
        "flask-cors>=4.0.0",
        "pyyaml>=6.0",
    ],
)
