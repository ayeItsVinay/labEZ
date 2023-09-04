import React, { useEffect, useState, useCallback } from 'react';
import Call from '../Call/Call';
import StartButton from '../StartButton/StartButton';
import './App.css';
import Tray from '../Tray/Tray';
import CallObjectContext from '../../CallObjectContext';
import DailyIframe from '@daily-co/daily-js';
import { logDailyEvent } from '../../logUtils';
import { createMeetingRoom } from '../../services/api';
import { useHistory } from 'react-router-dom';
import { db, auth } from '../../services/firebase';
import { fetchLabDetails } from '../../services/fb-helpers';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Container,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Row,
  Col,
} from 'reactstrap';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/theme-kuroir';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/snippets/javascript';

const STATE_IDLE = 'STATE_IDLE';
const STATE_CREATING = 'STATE_CREATING';
const STATE_JOINING = 'STATE_JOINING';
const STATE_JOINED = 'STATE_JOINED';
const STATE_LEAVING = 'STATE_LEAVING';
const STATE_ERROR = 'STATE_ERROR';

export default function App() {
  const [appState, setAppState] = useState(STATE_IDLE);
  const [roomUrl, setRoomUrl] = useState(null);
  const [callObject, setCallObject] = useState(null);
  const [labData, setLabData] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [clickedPB, setClickedPB] = useState({ title: '', description: '' });
  const [selectedPB, setSelectedPB] = useState({ title: '', description: '' });

  const toggle = () => setDropdownOpen((prevState) => !prevState);
  const toggleModal = () => {
    if (modalOpen) setClickedPB({ title: '', description: '' });
    setModalOpen(!modalOpen);
  };
  /**
   * Creates a new call room.
   */
  const createCall = useCallback(() => {
    setAppState(STATE_CREATING);
    return createMeetingRoom({
      name: String(Math.random()).slice(0, 9),
    })
      .then((room) => room.url)
      .catch((error) => {
        console.log('Error creating room', error);
        setRoomUrl(null);
        setAppState(STATE_IDLE);
      });
  }, []);

  /**
   * Starts joining an existing call.
   *
   * NOTE: In this demo we show how to completely clean up a call with destroy(),
   * which requires creating a new call object before you can join() again.
   * This isn't strictly necessary, but is good practice when you know you'll
   * be done with the call object for a while and you're no longer listening to its
   * events.
   */
  const startJoiningCall = useCallback((url) => {
    const newCallObject = DailyIframe.createCallObject({
      userName: auth().currentUser.uid,
    });
    setRoomUrl(url);
    setCallObject(newCallObject);
    setAppState(STATE_JOINING);
    newCallObject.join({ url });
    console.log({ name: auth().currentUser.uid });
    newCallObject.setUserName(auth().currentUser.uid, {
      thisMeetingOnly: true,
    });
  }, []);

  /**
   * Starts leaving the current call.
   */
  const startLeavingCall = useCallback(() => {
    if (!callObject) return;
    // If we're in the error state, we've already "left", so just clean up
    if (appState === STATE_ERROR) {
      callObject.destroy().then(() => {
        setRoomUrl(null);
        setCallObject(null);
        setAppState(STATE_IDLE);
      });
    } else {
      setAppState(STATE_LEAVING);
      callObject.leave();
    }
  }, [callObject, appState]);

  /**
   * If a room's already specified in the page's URL when the component mounts,
   * join the room.
   */
  const history = useHistory();
  useEffect(() => {
    const labSessionId = localStorage.getItem('labSessionId');
    if (!labSessionId || labSessionId === 'null')
      return history.push('/lab-session');
    // eslint-disable-next-line promise/catch-or-return
    fetchLabDetails(labSessionId).then((data) => setLabData(data));
  }, []);

  //

  useEffect(() => {
    const { url } = labData;
    url && startJoiningCall(url);
  }, [labData]);

  /**
   * Uncomment to attach call object to window for debugging purposes.
   */
  // useEffect(() => {
  //   window.callObject = callObject;
  // }, [callObject]);

  /**
   * Update app state based on reported meeting state changes.
   *
   * NOTE: Here we're showing how to completely clean up a call with destroy().
   * This isn't strictly necessary between join()s, but is good practice when
   * you know you'll be done with the call object for a while and you're no
   * longer listening to its events.
   */
  useEffect(() => {
    if (!callObject) return;

    const events = ['joined-meeting', 'left-meeting', 'error'];

    function handleNewMeetingState(event) {
      event && logDailyEvent(event);
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

  /**
   * Listen for app messages from other call participants.
   */
  useEffect(() => {
    if (!callObject) {
      return;
    }

    function handleAppMessage(event) {
      if (event) {
        logDailyEvent(event);
        console.log(`received app message from ${event.fromId}: `, event.data);
      }
    }

    callObject.on('app-message', handleAppMessage);

    return function cleanup() {
      callObject.off('app-message', handleAppMessage);
    };
  }, [callObject]);

  /**
   * Show the call UI if we're either joining, already joined, or are showing
   * an error.
   */
  const showCall = [STATE_JOINING, STATE_JOINED, STATE_ERROR].includes(
    appState
  );

  /**
   * Only enable the call buttons (camera toggle, leave call, etc.) if we're joined
   * or if we've errored out.
   *
   * !!!
   * IMPORTANT: calling callObject.destroy() *before* we get the "joined-meeting"
   * can result in unexpected behavior. Disabling the leave call button
   * until then avoids this scenario.
   * !!!
   */
  const enableCallButtons = [STATE_JOINED, STATE_ERROR].includes(appState);

  /**
   * Only enable the start button if we're in an idle state (i.e. not creating,
   * joining, etc.).
   *
   * !!!
   * IMPORTANT: only one call object is meant to be used at a time. Creating a
   * new call object with DailyIframe.createCallObject() *before* your previous
   * callObject.destroy() completely finishes can result in unexpected behavior.
   * Disabling the start button until then avoids that scenario.
   * !!!
   */
  const enableStartButton = appState === STATE_IDLE;

  return (
    <>
      <div className="app">
        <Row style={{ marginTop: '5px', backgroundColor: 'beige' }}>
          <Col style={{ marginLeft: '24px' }} md="4">
            <img
              width="75"
              src="https://shapeai-uploads.s3.ap-south-1.amazonaws.com/lab-ez-logo.png"
            />
            {labData?.problemStatements?.length > 0 && (
              <Dropdown
                style={{ display: 'inline-grid', marginLeft: '100px' }}
                color={selectedPB.title ? 'success' : 'danger'}
                isOpen={dropdownOpen}
                toggle={toggle}
              >
                <DropdownToggle
                  color={selectedPB.title ? 'success' : 'danger'}
                  caret
                >
                  {selectedPB.title || 'Select a problem statement'}
                </DropdownToggle>
                <DropdownMenu>
                  {labData.problemStatements.map((pb) => (
                    <DropdownItem
                      onClick={() => {
                        setClickedPB(pb);
                        toggleModal();
                      }}
                    >
                      {' '}
                      {pb.title}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            )}
          </Col>
          <Col md="4">
            <div className="justify-content-center d-flex text-capitalize">
              <h1>{labData.name}</h1>
            </div>
          </Col>
          <Col md="3">
            <p>Execution in: {labData.executionEnvironment}</p>
            <p style={{ margin: 0, padding: 0 }}>
              Lab Code: {localStorage.getItem('labSessionId')}
            </p>
          </Col>
        </Row>
        <hr style={{ color: 'purple', height: '2px', marginTop: 0 }} />
        {/* <div className={'justify-content-center d-flex text-capitalize'} > */}
        {/* </div> */}
        {/* <div className={'justify-content-center d-flex text-capitalize'} > */}
        {/* </div> */}

        {showCall && (
          // NOTE: for an app this size, it's not obvious that using a Context
          // is the best choice. But for larger apps with deeply-nested components
          // that want to access call object state and bind event listeners to the
          // call object, this can be a helpful pattern.
          <CallObjectContext.Provider value={callObject}>
            {/* <p>meh</p> */}
            <Call
              roomUrl={roomUrl}
              execLanguage={labData.executionEnvironment}
              selectedPB={selectedPB}
            />
            <Tray
              disabled={!enableCallButtons}
              onClickLeaveCall={startLeavingCall}
            />
          </CallObjectContext.Provider>
        )}
        <Modal isOpen={modalOpen} toggle={toggleModal}>
          <ModalHeader>{clickedPB.title}</ModalHeader>
          <ModalBody>
            <h3>Description</h3>
            <p>{clickedPB.description}</p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="success"
              onClick={() => {
                setSelectedPB(clickedPB);
                toggleModal();
              }}
            >
              Select
            </Button>
            <Button color="warning" onClick={toggleModal}>
              Go back
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </>
  );
}
