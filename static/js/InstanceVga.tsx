import React, { FC, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Icon, Row } from "@canonical/react-components";
import NotificationRow from "./components/NotificationRow";
import { Notification } from "./types/notification";
import * as SpiceHtml5 from "../assets/lib/spice/src/main";
import { fetchInstanceVga } from "./api/instances";
import { getWsErrorMsg } from "./util/helpers";
import BaseLayout from "./components/BaseLayout";
import useEventListener from "@use-it/event-listener";

type Params = {
  name: string;
};

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    spice_connection?: any;
  }
}

const InstanceVga: FC = () => {
  const { name } = useParams<Params>();
  const [notification, setNotification] = useState<Notification | null>(null);
  const spiceRef = useRef<HTMLDivElement>(null);

  const handleError = () => {
    setNotification({
      message: "spice error",
      type: "negative",
    });
  };

  const openVgaConsole = async () => {
    if (!name) {
      setNotification({
        message: "Missing name",
        type: "negative",
      });

      return;
    }

    const result = await fetchInstanceVga(name).catch((e) => {
      setNotification({
        message: e.message,
        type: "negative",
      });
    });
    if (!result) {
      return;
    }

    const dataUrl = `wss://${location.host}${result.operation}/websocket?secret=${result.metadata.metadata.fds["0"]}`;
    const controlUrl = `wss://${location.host}${result.operation}/websocket?secret=${result.metadata.metadata.fds.control}`;

    const control = new WebSocket(controlUrl);

    control.onerror = () => {
      setNotification({
        message: "There was an error with control websocket",
        type: "negative",
      });
    };

    control.onclose = (event) => {
      setNotification({
        message: getWsErrorMsg(event.code),
        type: "negative",
      });
    };

    control.onmessage = (message) => {
      console.log("control message", message);
    };

    try {
      window.spice_connection = new SpiceHtml5.SpiceMainConn({
        uri: dataUrl,
        screen_id: "spice-screen",
        onerror: handleError,
        onsuccess: () => {
          SpiceHtml5.handle_resize();
        },
      });
    } catch (e) {
      setNotification({
        message: "error connecting",
        type: "negative",
      });
    }
  };

  useEventListener("resize", SpiceHtml5.handle_resize);
  React.useEffect(() => {
    openVgaConsole();
  }, []);

  const handleFullScreen = () => {
    const container = spiceRef.current;
    if (!container) {
      return;
    }
    container
      .requestFullscreen()
      .then(SpiceHtml5.handle_resize)
      .catch((err) => {
        setNotification({
          message: `Failed to enter full-screen mode: ${err.message} (${err.name})`,
          type: "negative",
        });
      });
  };

  return (
    <>
      <BaseLayout
        title={`VGA Terminal for ${name}`}
        controls={
          <>
            <Button
              hasIcon={true}
              appearance="neutral"
              onClick={handleFullScreen}
            >
              <Icon name="fullscreen" />
              <span>Fullscreen</span>
            </Button>
            <Link className="p-button u-no-margin--bottom" to="/instances">
              Back
            </Link>
          </>
        }
      >
        <NotificationRow
          notification={notification}
          close={() => setNotification(null)}
        />
        <Row>
          <div id="spice-area" ref={spiceRef}>
            <div id="spice-screen" className="spice-screen" />
          </div>
        </Row>
      </BaseLayout>
    </>
  );
};

export default InstanceVga;