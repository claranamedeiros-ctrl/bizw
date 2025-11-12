"""
Logo Detection using OWLv2 (Google's Zero-Shot Object Detection)
Replaces 500+ lines of DOM heuristics with a simple AI model.
"""

import torch
from transformers import Owlv2Processor, Owlv2ForObjectDetection
from PIL import Image
from typing import Optional, Tuple


class LogoDetector:
    def __init__(self, model_name="google/owlv2-base-patch16-ensemble"):
        """Initialize OWLv2 model for zero-shot logo detection"""
        print(f"[LogoDetector] Loading OWLv2 model: {model_name}")

        self.processor = Owlv2Processor.from_pretrained(model_name)
        self.model = Owlv2ForObjectDetection.from_pretrained(model_name)

        # Use GPU if available
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)
        self.model.eval()

        print(f"[LogoDetector] Model loaded on {self.device}")

    async def detect_logo(self, image: Image.Image) -> Tuple[Optional[Tuple[int, int, int, int]], float]:
        """
        Detect company logo in an image using zero-shot detection.

        Args:
            image: PIL Image to search for logos

        Returns:
            (bbox, confidence): Bounding box as (x1, y1, x2, y2) and confidence score
                                Returns (None, 0.0) if no logo detected
        """
        # Text prompts for logo detection (zero-shot)
        text_queries = [
            "company logo",
            "brand logo",
            "website logo",
            "header logo"
        ]

        # Process image and text
        inputs = self.processor(
            text=text_queries,
            images=image,
            return_tensors="pt"
        ).to(self.device)

        # Run inference
        with torch.no_grad():
            outputs = self.model(**inputs)

        # Post-process to get boxes and scores
        target_sizes = torch.tensor([image.size[::-1]])  # (height, width)
        results = self.processor.post_process_object_detection(
            outputs,
            threshold=0.1,  # Low threshold, we'll filter later
            target_sizes=target_sizes
        )[0]

        boxes = results["boxes"].cpu().numpy()
        scores = results["scores"].cpu().numpy()
        labels = results["labels"].cpu().numpy()

        if len(boxes) == 0:
            return None, 0.0

        # Find the highest confidence detection
        best_idx = scores.argmax()
        best_bbox = boxes[best_idx]
        best_score = scores[best_idx]

        # Convert bbox from [x_min, y_min, x_max, y_max] to tuple
        bbox_tuple = tuple(map(int, best_bbox))

        # Filter out very large boxes (likely false positives that cover whole page)
        img_width, img_height = image.size
        box_width = bbox_tuple[2] - bbox_tuple[0]
        box_height = bbox_tuple[3] - bbox_tuple[1]
        box_area = box_width * box_height
        img_area = img_width * img_height

        # If box is more than 50% of image, it's probably not a logo
        if box_area > img_area * 0.5:
            print(f"[LogoDetector] Rejecting large box: {box_area / img_area * 100:.1f}% of image")
            return None, 0.0

        # Filter out very small boxes (< 40x40 pixels)
        if box_width < 40 or box_height < 40:
            print(f"[LogoDetector] Rejecting small box: {box_width}x{box_height}")
            return None, 0.0

        print(f"[LogoDetector] Best detection: confidence={best_score:.3f}, "
              f"bbox={bbox_tuple}, size={box_width}x{box_height}")

        return bbox_tuple, float(best_score)
