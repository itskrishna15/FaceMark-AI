import cv2
import numpy as np
import insightface
from insightface.app import FaceAnalysis

# Initialize the face analysis app
# We use the 'buffalo_l' model which includes both detection (RetinaFace) and recognition (ArcFace)
# providers=['CPUExecutionProvider'] by default unless GPU is available
face_app = FaceAnalysis(name='buffalo_l')
face_app.prepare(ctx_id=0, det_size=(640, 640)) # ctx_id=0 for GPU, -1 for CPU. Assuming GPU available or fallback to CPU.

def extract_faces_and_embeddings(image_bytes: bytes):
    """
    Takes an image in bytes, decodes it, and extracts all faces and their embeddings.
    Returns a list of dicts: [{'bbox': [...], 'embedding': [...], 'det_score': float}]
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise ValueError("Invalid image data")

    faces = face_app.get(img)
    
    results = []
    for face in faces:
        results.append({
            'bbox': face.bbox.tolist(),
            'embedding': face.embedding.tolist(),
            'det_score': float(face.det_score)
        })
        
    return results

def get_average_embedding(embeddings_list):
    """
    Takes a list of embeddings (lists of floats) and returns the average embedding.
    Useful for onboarding when 3 images are provided.
    """
    if not embeddings_list:
        return None
    
    # Convert list of lists to 2D numpy array
    arr = np.array(embeddings_list)
    # Calculate mean along the column axis (axis=0)
    avg_embedding = np.mean(arr, axis=0)
    
    # L2 normalize the resulting average embedding
    norm = np.linalg.norm(avg_embedding)
    if norm == 0:
        return avg_embedding.tolist()
    return (avg_embedding / norm).tolist()
