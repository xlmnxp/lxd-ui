import React, { FC, KeyboardEvent } from "react";
import { Button, Modal } from "@canonical/react-components";
import { useFormik } from "formik";
import { queryKeys } from "util/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import SubmitButton from "components/SubmitButton";
import { LxdStorageVolume } from "types/storage";
import {
  StorageVolumeFormValues,
  volumeFormToPayload,
} from "pages/storage/forms/StorageVolumeForm";
import { getStorageVolumeEditValues } from "util/storageVolumeEdit";
import { updateStorageVolume } from "api/storage-pools";
import StorageVolumeSnapshotsForm from "../../forms/StorageVolumeSnapshotsForm";

interface Props {
  volume: LxdStorageVolume;
  close: () => void;
  onSuccess: (message: string) => void;
  onFailure: (title: string, e: unknown) => void;
}

const VolumeConfigureSnapshotModal: FC<Props> = ({
  volume,
  close,
  onSuccess,
  onFailure,
}) => {
  const queryClient = useQueryClient();

  const formik = useFormik<StorageVolumeFormValues>({
    initialValues: getStorageVolumeEditValues(volume),
    onSubmit: (values) => {
      const saveVolume = volumeFormToPayload(values, volume.project);
      void updateStorageVolume(volume.pool, volume.project, {
        ...saveVolume,
        etag: volume.etag,
      })
        .then(() => {
          onSuccess("Configuration updated.");
          void queryClient.invalidateQueries({
            queryKey: [queryKeys.storage],
            predicate: (query) =>
              query.queryKey[0] === queryKeys.volumes ||
              query.queryKey[0] === queryKeys.storage,
          });
        })
        .catch((e: Error) => {
          onFailure("Configuration update failed", e);
        })
        .finally(() => {
          close();
          formik.setSubmitting(false);
        });
    },
  });

  const handleEscKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape") {
      close();
    }
  };

  return (
    <Modal
      close={close}
      className="edit-snapshot-config"
      title="Snapshot configuration"
      buttonRow={
        formik.values.isReadOnly ? (
          <div className="u-space-between u-flex-row-reverse">
            <Button
              className="u-no-margin--bottom u-no-margin--right"
              onClick={close}
            >
              Close
            </Button>
            <Button
              className="u-no-margin--bottom"
              type="button"
              onClick={() => void formik.setFieldValue("isReadOnly", false)}
            >
              Edit configuration
            </Button>
          </div>
        ) : (
          <>
            <Button
              appearance="base"
              className="u-no-margin--bottom"
              type="button"
              onClick={close}
            >
              Cancel
            </Button>
            <SubmitButton
              buttonLabel="Save"
              className="u-no-margin--bottom"
              isSubmitting={formik.isSubmitting}
              isDisabled={formik.isSubmitting}
              onClick={() => void formik.submitForm()}
            />
          </>
        )
      }
      onKeyDown={handleEscKey}
    >
      <StorageVolumeSnapshotsForm formik={formik} />
    </Modal>
  );
};

export default VolumeConfigureSnapshotModal;