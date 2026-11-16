// Lab metadata: titles, weeks, objectives, procedure, algorithms and the ordered steps.
export interface Step { id: string; title: string; instruction: string }
export interface LabMeta {
  n: number
  slug: string
  title: string
  short: string
  week: string
  objective: string
  algorithm: string
  steps: Step[]
}

const s = (id: string, title: string, instruction: string): Step => ({ id, title, instruction })

export const LABS: LabMeta[] = [
  {
    n: 1, slug: 'lab1', title: 'Image Manipulation', short: 'Pixels & channels', week: 'Weeks 1–2',
    objective: 'Understand how an image is stored as an array and manipulate it with OpenCV and NumPy.',
    algorithm: 'cv2.imread arrays (H×W×3, BGR), cv2.split, cv2.cvtColor, NumPy slicing, cv2.resize, cv2.rotate.',
    steps: [
      s('load', 'Load an image', 'Load the image and read its shape (height, width, channels).'),
      s('bgr', 'Explore BGR', 'Split the image into B, G and R channels, then toggle the RGB misreading.'),
      s('gray', 'Convert to grayscale', 'Drag the slider to compare the color and grayscale versions.'),
      s('inspect', 'Inspect pixels', 'Hover over the image to read the coordinates and B, G, R values.'),
      s('paint', 'Change a pixel', 'Pick a color and brush size, then click the image to paint.'),
      s('crop', 'Crop ROI', 'Drag a rectangle on the image to crop a region of interest.'),
      s('resize', 'Resize', 'Change the scale and observe the new dimensions.'),
      s('rotate', 'Rotate', 'Rotate the image by 90°, 180° or 270°.'),
      s('summary', 'Summary', 'Write what you observed, then download your results.'),
    ],
  },
  {
    n: 2, slug: 'lab2', title: 'Edge Detection', short: 'Sobel & Canny', week: 'Weeks 3–4',
    objective: 'Detect edges using gradient (Sobel) and multi-stage (Canny) methods and compare them.',
    algorithm: 'Gaussian blur, Sobel (CV_64F) X/Y gradients, cv2.magnitude, Canny hysteresis thresholds.',
    steps: [
      s('load', 'Load as grayscale', 'Load the image and convert it to grayscale.'),
      s('blur', 'Gaussian blur', 'Smooth the image to suppress noise before differentiating.'),
      s('sobel', 'Sobel X and Y', 'Compute horizontal and vertical gradients separately.'),
      s('magnitude', 'Sobel magnitude', 'Combine both gradients with cv2.magnitude.'),
      s('canny', 'Canny', 'Tune the low and high thresholds.'),
      s('compare', 'Compare', 'Compare Original, Sobel and Canny side by side.'),
    ],
  },
  {
    n: 3, slug: 'lab3', title: 'Histogram Equalization', short: 'Contrast & CLAHE', week: 'Weeks 4–5',
    objective: 'Improve contrast with equalization, linear stretching and CLAHE, and read histograms.',
    algorithm: 'cv2.equalizeHist, YUV/HSV channel equalization, convertScaleAbs (αf+β), CLAHE.',
    steps: [
      s('load', 'Load and histogram', 'Convert to grayscale and plot the intensity histogram.'),
      s('global', 'Global equalization', 'Apply equalizeHist and compare histograms.'),
      s('color', 'Color equalization', 'Equalize only the Y (YUV) or V (HSV) channel.'),
      s('stretch', 'Contrast stretching', 'Adjust alpha (gain) and beta (bias).'),
      s('clahe', 'CLAHE', 'Tune clip limit and tile grid size.'),
      s('compare', 'Compare', 'Compare all methods and their histograms.'),
    ],
  },
  {
    n: 4, slug: 'lab4', title: 'SURF Feature Detection', short: 'Keypoints & matching', week: 'Week 6',
    objective: 'Detect and describe local features, match them across images and compare detectors.',
    algorithm: 'SURF (Hessian detector), BFMatcher/FLANN with Lowe ratio test, ORB, SIFT, U-SURF.',
    steps: [
      s('load', 'Load as grayscale', 'Load the image used for feature detection.'),
      s('detect', 'Detect keypoints', 'Change the Hessian threshold and watch the keypoint count.'),
      s('rich', 'Rich keypoints', 'Draw keypoints with their size and orientation.'),
      s('match', 'Match two images', 'Load a second image and match descriptors.'),
      s('compare', 'SURF vs ORB vs SIFT', 'Compare keypoints, matches and run time.'),
      s('upright', 'U-SURF and rotation', 'Test upright SURF on a rotated copy.'),
    ],
  },
  {
    n: 5, slug: 'lab5', title: 'PCA and Eigenfaces', short: 'Face recognition', week: 'Weeks 7–8',
    objective: 'Reduce dimensionality with PCA and use eigenfaces for face recognition with an SVM.',
    algorithm: 'LFW dataset, PCA (randomized SVD, whiten), RBF-kernel SVC with balanced class weights.',
    steps: [
      s('data', 'Load the dataset', 'Fetch the LFW faces and split train/test 80/20.'),
      s('fit', 'Fit PCA', 'Fit 150 components on the training set only.'),
      s('eigen', 'View eigenfaces', 'Look at the principal components as images.'),
      s('variance', 'Explained variance', 'Read the cumulative variance curve.'),
      s('recon', 'Reconstruct a face', 'Rebuild a test face from k components.'),
      s('train', 'Train the classifier', 'Train an SVM and read the classification report.'),
      s('recognize', 'Recognize a face', 'Pick a test face and see the prediction.'),
      s('fail', 'Failure gallery', 'Inspect misclassified faces and reflect.'),
    ],
  },
  {
    n: 6, slug: 'lab6', title: 'YOLO Object Detection', short: 'Real-time detection', week: 'Weeks 8–9',
    objective: 'Run YOLO object detection on images and the webcam, and prepare a custom dataset.',
    algorithm: 'YOLO11n (Ultralytics) one-stage detector: boxes, class labels, confidence, NMS.',
    steps: [
      s('image', 'Detect in an image', 'Upload an image and adjust the confidence threshold.'),
      s('webcam', 'Webcam detection', 'Run detection on live frames and watch the FPS.'),
      s('dataset', 'Dataset preparation', 'Visualize YOLO-format labels on an image.'),
      s('train', 'Training commands', 'Copy the train and validation commands.'),
      s('custom', 'Custom weights', 'Upload a trained best.pt and detect with it.'),
      s('reflect', 'Reflection', 'Compare detection with classification.'),
    ],
  },
  {
    n: 7, slug: 'lab7', title: 'Segmentation', short: 'Regions & masks', week: 'Week 13',
    objective: 'Partition images into meaningful regions with classical and deep-learning methods.',
    algorithm: 'Otsu/adaptive thresholds, region growing, watershed, Canny contours, DeepLabV3.',
    steps: [
      s('thresh', 'Global and Otsu', 'Threshold the image globally and with Otsu.'),
      s('adaptive', 'Adaptive threshold', 'Tune block size and constant C.'),
      s('region', 'Region growing', 'Click a seed point and grow a region.'),
      s('watershed', 'Watershed', 'Separate touching objects.'),
      s('edge', 'Edge-based', 'Canny, closed contours, then filled regions.'),
      s('deeplab', 'DeepLabV3', 'Run semantic segmentation (VOC classes).'),
      s('compare', 'Compare', 'Compare all methods and score IoU.'),
    ],
  },
]

export const getLab = (n: number) => LABS.find((l) => l.n === n)!
export const TOTAL_STEPS = LABS.reduce((a, l) => a + l.steps.length, 0)

export const SAMPLES = [
  { file: 'astronaut.png', label: 'Astronaut' },
  { file: 'coins.png', label: 'Coins' },
  { file: 'camera.png', label: 'Cameraman' },
  { file: 'chelsea.png', label: 'Cat' },
  { file: 'coffee.png', label: 'Coffee' },
  { file: 'page.png', label: 'Text page' },
  { file: 'street.png', label: 'Rocket' },
]
