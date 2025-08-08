import numpy as np
import os
import matplotlib.pyplot as plt  # Optional
try:
    # Optional: use scikit-image for histogram equalization if available
    from skimage.exposure import equalize_hist  # type: ignore
    _HAS_SKIMAGE = True
except Exception:
    _HAS_SKIMAGE = False

file_path = 'public/head256x256x109'  # Replace with your file
dims = (109, 256, 256)  # ZYX order common; swap if slices look wrong
expected_voxels = np.prod(dims)

# Get file size
file_size = os.path.getsize(file_path)
bytes_per_voxel = file_size / expected_voxels
print(f"File size: {file_size} bytes")
print(f"Bytes per voxel: {bytes_per_voxel:.2f}")

# Infer dtype/channels (adjust based on bytes_per_voxel)
if bytes_per_voxel == 2:
    dtype = np.int16  # Or np.uint16; try both
    channels = 1  # Scalar
elif bytes_per_voxel == 1:
    dtype = np.uint8
    channels = 1
elif bytes_per_voxel == 3:
    dtype = np.uint8
    channels = 3  # Vector (RGB)
else:
    raise ValueError("Unexpected bytes per voxel; check dimensions or compression.")

# Load (swap endian with dtype.newbyteorder('>') if needed)
data = np.fromfile(file_path, dtype=dtype)
if len(data) != expected_voxels * channels:
    raise ValueError("Size mismatch; possible header or wrong dims.")

if channels > 1:
    data = data.reshape(dims + (channels,))  # Add channel dim
    print(f"Likely vector with {channels} channels (e.g., color).")
else:
    data = data.reshape(dims)
    print("Likely scalar intensities.")

# Stats to validate (CT scalars: min ~ -1024, max ~4095 for uint16; -1000 to 3000 for int16)
print("Shape:", data.shape)
print("Dtype:", data.dtype)
print("Min/Max:", data.min(), data.max())

# Optional: Mid-slice view/histogram
z_mid = dims[0] // 2
mid_slice = data[z_mid] if channels == 1 else data[z_mid, ..., 0]  # First channel if vector
plt.imshow(mid_slice, cmap='gray')
plt.title("Mid Slice (if looks like head CT, good)")
plt.show()
plt.hist(data.ravel(), bins=100)
plt.title("Histogram (broad peak for CT scalars)")
plt.show()

# Optional: global histogram equalization / percentile stretch visualization
if channels == 1:
    # Compute robust percentiles on full volume
    p2, p98 = np.percentile(data, (2, 98))
    denom = float(p98 - p2) if p98 > p2 else 1.0
    stretched = np.clip((data.astype(np.float32) - p2) / denom, 0.0, 1.0)

    # Show percentile-stretched mid-slice (NumPy-only path)
    plt.imshow(stretched[z_mid], cmap='inferno')
    plt.title("Percentile-Stretched Mid-Slice (2–98%)")
    plt.show()

    # If scikit-image is available, also show histogram-equalized mid-slice
    if _HAS_SKIMAGE:
        # equalize_hist expects float image, ideally in [0, 1]
        equalized = equalize_hist(stretched)
        plt.imshow(equalized[z_mid], cmap='inferno')
        plt.title("Equalized Mid-Slice (skimage.exposure.equalize_hist)")
        plt.show()