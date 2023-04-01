import React, { FC, useEffect, useState } from "react";
import {
  Button,
  Col,
  Form,
  Notification,
  Row,
} from "@canonical/react-components";
import { useFormik } from "formik";
import { updateInstance } from "api/instances";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import SubmitButton from "components/SubmitButton";
import { dump as dumpYaml } from "js-yaml";
import { yamlToObject } from "util/yaml";
import { useParams } from "react-router-dom";
import { LxdInstance } from "types/instance";
import { useNotify } from "context/notify";
import { FormDeviceValues } from "util/formDevices";
import SecurityPoliciesForm, {
  SecurityPoliciesFormValues,
} from "pages/instances/forms/SecurityPoliciesForm";
import SnapshotsForm, {
  SnapshotFormValues,
} from "pages/instances/forms/SnapshotsForm";
import CloudInitForm, {
  CloudInitFormValues,
} from "pages/instances/forms/CloudInitForm";
import ResourceLimitsForm, {
  ResourceLimitsFormValues,
} from "pages/instances/forms/ResourceLimitsForm";
import YamlForm, { YamlFormValues } from "pages/instances/forms/YamlForm";
import InstanceEditDetailsForm, {
  InstanceEditDetailsFormValues,
} from "pages/instances/forms/InstanceEditDetailsForm";
import InstanceFormMenu, {
  CLOUD_INIT,
  INSTANCE_DETAILS,
  NETWORKS,
  RESOURCE_LIMITS,
  SECURITY_POLICIES,
  SNAPSHOTS,
  STORAGE,
  YAML_CONFIGURATION,
} from "pages/instances/forms/InstanceFormMenu";
import useEventListener from "@use-it/event-listener";
import { updateMaxHeight } from "util/updateMaxHeight";
import RootStorageForm from "pages/instances/forms/RootStorageForm";
import NetworkForm from "pages/instances/forms/NetworkForm";
import {
  getInstanceEditValues,
  getInstancePayload,
  InstanceEditSchema,
} from "util/instanceEdit";

export type EditInstanceFormValues = InstanceEditDetailsFormValues &
  FormDeviceValues &
  ResourceLimitsFormValues &
  SecurityPoliciesFormValues &
  SnapshotFormValues &
  CloudInitFormValues &
  YamlFormValues;

interface Props {
  instance: LxdInstance;
}

const EditInstanceForm: FC<Props> = ({ instance }) => {
  const notify = useNotify();
  const { project } = useParams<{ project: string }>();
  const queryClient = useQueryClient();
  const [section, setSection] = useState(INSTANCE_DETAILS);
  const [isConfigOpen, setConfigOpen] = useState(true);

  if (!project) {
    return <>Missing project</>;
  }

  const updateFormHeight = () => {
    updateMaxHeight("form-contents", "p-bottom-controls");
  };
  useEffect(updateFormHeight, [notify.notification?.message, section]);
  useEventListener("resize", updateFormHeight);

  const formik = useFormik<EditInstanceFormValues>({
    initialValues: getInstanceEditValues(instance),
    validationSchema: InstanceEditSchema,
    onSubmit: (values) => {
      const instancePayload = (
        values.yaml
          ? yamlToObject(values.yaml)
          : getInstancePayload(instance, values)
      ) as LxdInstance;

      // ensure the etag is set (it is missing on the yaml)
      instancePayload.etag = instance.etag;

      updateInstance(instancePayload, project)
        .then(() => {
          notify.success("Instance updated.");
          void formik.setFieldValue("readOnly", true);
        })
        .catch((e: Error) => {
          notify.failure("", e, undefined, "Instance update failed");
        })
        .finally(() => {
          formik.setSubmitting(false);
          void queryClient.invalidateQueries({
            queryKey: [queryKeys.instances],
          });
        });
    },
  });

  const updateSection = (newItem: string) => {
    if (section === YAML_CONFIGURATION && newItem !== YAML_CONFIGURATION) {
      void formik.setFieldValue("yaml", undefined);
    }
    setSection(newItem);
  };

  const toggleMenu = () => {
    setConfigOpen((old) => !old);
  };

  const getYaml = () => {
    const exclude = new Set([
      "backups",
      "snapshots",
      "state",
      "expanded_config",
      "expanded_devices",
      "etag",
    ]);
    const bareInstance = Object.fromEntries(
      Object.entries(instance).filter((e) => !exclude.has(e[0]))
    );
    return dumpYaml(bareInstance);
  };

  const isReadOnly = formik.values.readOnly;

  return (
    <div className="edit-instance">
      <Form onSubmit={() => void formik.submitForm()} stacked className="form">
        <InstanceFormMenu
          active={section}
          setActive={updateSection}
          isConfigDisabled={false}
          isConfigOpen={isConfigOpen}
          toggleConfigOpen={toggleMenu}
        />
        <Row className="form-contents" key={section}>
          <Col size={12}>
            {section === INSTANCE_DETAILS && (
              <InstanceEditDetailsForm formik={formik} project={project} />
            )}

            {section === STORAGE && (
              <RootStorageForm formik={formik} project={project} />
            )}

            {section === NETWORKS && (
              <NetworkForm formik={formik} project={project} />
            )}

            {section === RESOURCE_LIMITS && (
              <ResourceLimitsForm formik={formik} />
            )}

            {section === SECURITY_POLICIES && (
              <SecurityPoliciesForm formik={formik} />
            )}

            {section === SNAPSHOTS && <SnapshotsForm formik={formik} />}

            {section === CLOUD_INIT && <CloudInitForm formik={formik} />}

            {section === YAML_CONFIGURATION && (
              <YamlForm
                yaml={getYaml()}
                setYaml={(yaml) => void formik.setFieldValue("yaml", yaml)}
                isReadOnly={isReadOnly}
              >
                {!isReadOnly && (
                  <Notification
                    severity="caution"
                    title="Before you edit the YAML"
                  >
                    Changes will be discarded, when switching back to the guided
                    forms.
                  </Notification>
                )}
              </YamlForm>
            )}
          </Col>
        </Row>
      </Form>
      <div className="p-bottom-controls">
        <hr />
        <Row className="u-align--right">
          <Col size={12}>
            {isReadOnly ? (
              <Button
                appearance="positive"
                onClick={() => formik.setFieldValue("readOnly", false)}
              >
                Edit instance
              </Button>
            ) : (
              <>
                <Button
                  onClick={() =>
                    formik.setValues(getInstanceEditValues(instance))
                  }
                >
                  Cancel
                </Button>
                <SubmitButton
                  isSubmitting={formik.isSubmitting}
                  isDisabled={!formik.isValid}
                  buttonLabel="Save changes"
                  onClick={() => void formik.submitForm()}
                />
              </>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default EditInstanceForm;
