import React, { useEffect, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { useHistory } from 'react-router-dom';
import { db } from '../../services/firebase';
import Tray from '../../components/Tray';
import CallObjectContext from '../../CallObjectContext';
import Call from './Main';

const STATE_IDLE = 'STATE_IDLE';
const STATE_CREATING = 'STATE_CREATING';
const STATE_JOINING = 'STATE_JOINING';
const STATE_JOINED = 'STATE_JOINED';
const STATE_LEAVING = 'STATE_LEAVING';
const STATE_ERROR = 'STATE_ERROR';

const LabSession = (): React.FC => {
  // @ts-ignore
  const [labData, setLabData] = useState({});
  const [appState, setAppState] = useState(STATE_IDLE);
  const [roomUrl, setRoomUrl] = useState(null);
  const [callObject, setCallObject] = useState(null);


  useEffect(() => {
    if (Object.keys(labData).length > 0) {
      const newCallObject = DailyIframe.createCallObject();
      setRoomUrl(labData.url);
      setCallObject(newCallObject);
      setAppState(STATE_JOINING);
      newCallObject
        .join({ url: labData.url })
        .then((res) => {
          console.log({ res });
        })
        .catch((er) => {
          console.log(er);
        });
    }
  }, [labData]);

  useEffect(() => {
    if (!callObject) return;

    const events = ['joined-meeting', 'left-meeting', 'error'];

    function handleNewMeetingState(event?: string) {
      if (event)
        switch (callObject.meetingState()) {
          case 'joined-meeting':
            setAppState(STATE_JOINED);
            break;
          case 'left-meeting':
            callObject.destroy().then(() => {
              setRoomUrl(null);
              setCallObject(null);
              setAppState(STATE_IDLE);
            });
            break;
          case 'error':
            setAppState(STATE_ERROR);
            break;
          default:
            break;
        }
    }

    // Use initial state
    handleNewMeetingState();

    // Listen for changes in state
    // @ts-ignore
    for (const event of events) {
      callObject.on(event, handleNewMeetingState);
    }

    // Stop listening for changes in state
    return function cleanup() {
      for (const event of events) {
        callObject.off(event, handleNewMeetingState);
      }
    };
  }, [callObject]);


  return (
    <>
      {JSON.stringify(labData)}
      {/* <MyComponent /> */}
      {/* <VideoCallFrame /> */}
      <CallObjectContext.Provider value={callObject}>
        <Call />
        <Tray
          disabled={appState === STATE_IDLE}
          onClickLeaveCall={() => console.log('byeeeee')}
        />
      </CallObjectContext.Provider>
    </>
  );
};

export default LabSession;
