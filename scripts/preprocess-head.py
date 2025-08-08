import numpy as np
import matplotlib.pyplot as plt
from matplotlib.widgets import Slider
import zipfile

# Load data (adjust path if unzipped)
zip_path = 'public/head256x256x109.zip'
with zipfile.ZipFile(zip_path, 'r') as z:
    raw_data = z.read('head256x256x109')
data = np.frombuffer(raw_data, dtype=np.uint8).reshape(109, 256, 256)  # Z, Y, X
data = data.astype(np.float32) / 255.0

# Initial settings
initial_slice = 30
initial_level = 0.2

# Coordinate grid with y increasing upward to match origin='lower'
x = np.arange(256)
y = np.arange(256)
X, Y = np.meshgrid(x, y)

# Setup figure
fig, ax = plt.subplots()
plt.subplots_adjust(left=0.1, bottom=0.35)
img = ax.imshow(data[initial_slice], cmap='gray', origin='lower', extent=[0, 256, 0, 256])
cs = ax.contour(X, Y, data[initial_slice], levels=[initial_level], colors=['blue'])
ax.set_aspect('equal')
ax.set_title(f'Slice {initial_slice}: Iso-Contours')

# Sliders for thresholds
ax_level = plt.axes([0.1, 0.22, 0.8, 0.03])
level_slider = Slider(ax_level, 'Level', 0.01, 1.0, valinit=0.2)

# Slider for slice
ax_slice = plt.axes([0.1, 0.1, 0.8, 0.03])
slice_slider = Slider(ax_slice, 'Slice', 0, 108, valinit=initial_slice, valstep=1)

# Update function
def update(val):
    current_slice = int(slice_slider.val)
    level = level_slider.val
    ax.cla()
    ax.imshow(data[current_slice], cmap='gray', origin='lower', extent=[0, 256, 0, 256])
    ax.contour(X, Y, data[current_slice], levels=[level], colors='blue')
    ax.set_title(f'Slice {current_slice}: Iso-Contour @ {level:.3f}')
    ax.set_aspect('equal')
    fig.canvas.draw_idle()

# Connect sliders
level_slider.on_changed(update)
slice_slider.on_changed(update)

plt.show()