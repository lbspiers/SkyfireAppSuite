import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import styles from '../../styles/ProjectAdd.module.css';
import axios from '../../config/axios';
import logger from '../services/devLogger';
import PhotoModal from '../ui/PhotoModal';
import { processFileForUpload } from '../../utils/imageProcessor';
import { getThumbUrl } from '../../utils/photoUtils';

const ProjectPhotoGallery = ({ projectUuid }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (projectUuid) {
      fetchPhotos();
    }
  }, [projectUuid]);

  const fetchPhotos = async () => {
    if (!projectUuid) return;

    setLoading(true);
    try {
      const companyData = JSON.parse(sessionStorage.getItem('companyData') || '{}');
      const response = await axios.get(`/project/${projectUuid}/photos`, {
        params: { companyId: companyData.uuid }
      });

      if (response.data.status === 'SUCCESS' && Array.isArray(response.data.data)) {
        setPhotos(response.data.data);
      }
    } catch (error) {
      logger.error('Project', 'Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (!projectUuid) {
      toast.warning('Please create the project first before uploading photos.', {
        position: 'top-center',
        autoClose: 4000,
      });
      return;
    }

    setUploading(true);

    try {
      const companyData = JSON.parse(sessionStorage.getItem('companyData') || '{}');

      // Process and upload files one by one
      for (const file of files) {
        // Process file (handles HEIC conversion + compression)
        const result = await processFileForUpload(file, projectUuid, ({ stage, percent }) => {
          logger.log('ProjectPhotoGallery', `Processing ${file.name}: ${stage} ${percent}%`);
        });

        // Check if server already converted and uploaded
        if (result.serverConverted) {
          logger.log('ProjectPhotoGallery', `Server-converted file, skipping upload: ${result.fileName}`);
          // File already uploaded by server, skip the upload step
          continue;
        }

        // Upload the processed file
        const formData = new FormData();
        formData.append('photo', result.file);

        await axios.post(`/project/${projectUuid}/photos?companyId=${companyData.uuid}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      toast.success(`Uploaded ${files.length} photo${files.length > 1 ? 's' : ''}`, {
        position: 'top-center',
        autoClose: 3000,
      });

      // Refresh photo list
      await fetchPhotos();

      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      logger.error('Project', 'Error uploading photos:', error);
      toast.error('Failed to upload photos. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoClick = (photo) => {
    // Open photo in modal viewer
    setSelectedPhoto(photo);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <div>
      {/* Gallery Header */}
      <div className={styles.galleryHeader}>
        <h2 className={styles.galleryTitle}>
          Photo Gallery & Files {photos.length > 0 && `(${photos.length})`}
        </h2>
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={uploading || !projectUuid}
          className={styles.uploadButton}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* Photo Grid */}
      {loading ? (
        <div className={styles.loading}>
          <p>Loading photos...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className={styles.photoGrid}>
          <div className={styles.photoCard}>
            <div className={styles.photoPlaceholder}>
              <div className={styles.photoPlaceholderIcon}>📷</div>
              <div className={styles.photoPlaceholderText}>
                {projectUuid ? 'No photos yet' : 'Create project to upload'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          className={styles.photoGrid}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id || index}
              className={styles.photoCard}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              onClick={() => handlePhotoClick(photo)}
            >
              <img
                src={getThumbUrl(photo)} // Use optimized thumbnail (~40KB vs 4MB)
                alt={photo.name || `Photo ${index + 1}`}
                className={styles.photoImage}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
};

export default ProjectPhotoGallery;
