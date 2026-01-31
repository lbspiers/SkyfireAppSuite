import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import styles from './BOSDetectionModal.module.css';

const BOSDetectionModal = ({
  isOpen,
  onClose,
  onConfirm,
  detectionResult,
  summary,
  itemCount,
  isLoading,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Utility Required Equipment"
      size="md"
      scopedToPanel={true}
      contained={true}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {!isLoading && detectionResult && itemCount > 0 && (
            <Button variant="primary" onClick={onConfirm}>
              Add Equipment ({itemCount} items)
            </Button>
          )}
        </>
      }
    >
      <div>
          {isLoading ? (
            <div className={styles.loadingState}>
              <p>Detecting BOS configurations...</p>
            </div>
          ) : detectionResult && itemCount > 0 ? (
            <>
              <div className={styles.detectionSummary}>
                <p className={styles.detectionCount}>
                  <strong>Detected {itemCount} BOS equipment item{itemCount !== 1 ? 's' : ''}</strong>
                </p>

                {detectionResult.system1 && (
                  <div className={styles.systemSection}>
                    <p className={styles.systemTitle}>System 1: {detectionResult.system1.configName}</p>
                    <p className={styles.systemDescription}>{detectionResult.system1.description}</p>
                    <p className={styles.confidence}>
                      Confidence: {detectionResult.system1.confidence}
                    </p>
                  </div>
                )}

                {detectionResult.system2 && (
                  <div className={styles.systemSection}>
                    <p className={styles.systemTitle}>System 2: {detectionResult.system2.configName}</p>
                    <p className={styles.systemDescription}>{detectionResult.system2.description}</p>
                    <p className={styles.confidence}>
                      Confidence: {detectionResult.system2.confidence}
                    </p>
                  </div>
                )}

                {detectionResult.system3 && (
                  <div className={styles.systemSection}>
                    <p className={styles.systemTitle}>System 3: {detectionResult.system3.configName}</p>
                    <p className={styles.systemDescription}>{detectionResult.system3.description}</p>
                    <p className={styles.confidence}>
                      Confidence: {detectionResult.system3.confidence}
                    </p>
                  </div>
                )}

                {detectionResult.system4 && (
                  <div className={styles.systemSection}>
                    <p className={styles.systemTitle}>System 4: {detectionResult.system4.configName}</p>
                    <p className={styles.systemDescription}>{detectionResult.system4.description}</p>
                    <p className={styles.confidence}>
                      Confidence: {detectionResult.system4.confidence}
                    </p>
                  </div>
                )}

                {detectionResult.combinedConfig && (
                  <div className={styles.systemSection}>
                    <p className={styles.systemTitle}>
                      Combine Point: {detectionResult.combinedConfig.configName}
                    </p>
                    <p className={styles.systemDescription}>
                      {detectionResult.combinedConfig.description}
                    </p>
                  </div>
                )}
              </div>

              {summary && (
                <div className={styles.equipmentDetails}>
                  <p className={styles.detailsTitle}>Equipment to be added:</p>
                  <pre className={styles.summaryText}>{summary}</pre>
                </div>
              )}

              <div className={styles.warningBox}>
                <p>
                  <strong>Note:</strong> Equipment with catalog matches will be auto-populated.
                  Items without matches will require manual selection.
                </p>
              </div>
            </>
          ) : (
            <div className={styles.noDetection}>
              <p>
                <strong>No BOS configurations detected</strong>
              </p>
              <p>
                Please ensure all equipment is filled out completely (solar panels, inverters,
                batteries, etc.) and try again.
              </p>
              <p>
                If you have 2+ systems, make sure to select a combination method (Combiner Panel or
                Junction Box).
              </p>
            </div>
          )}
      </div>
    </Modal>
  );
};

export default BOSDetectionModal;
