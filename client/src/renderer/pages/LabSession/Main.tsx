import React, { useEffect, useContext, useReducer, useCallback, useState } from 'react';
import { Col, Row } from 'reactstrap';
// import './Call.css';
import Tile from '../../components/Tile';
import CallObjectContext from '../../CallObjectContext';
import CallMessage from '../CallMessage/CallMessage';
import {
  initialCallState,
  CLICK_ALLOW_TIMEOUT,
  PARTICIPANTS_CHANGE,
  CAM_OR_MIC_ERROR,
  FATAL_ERROR,
  callReducer,
  isLocal,
  isScreenShare,
  containsScreenShare,
  getMessage,
} from './callState';

export default function Call() {
  const callObject = useContext(CallObjectContext);
  const [callState, dispatch] = useReducer(callReducer, initialCallState);
  const [mainView, setMainView] = useState(null);

  /**
   * Start listening for participant changes, when the callObject is set.
   */
  useEffect(() => {
    if (!callObject) return;

    const events = [
      'participant-joined',
      'participant-updated',
      'participant-left',
    ];

    function handleNewParticipantsState(event) {
      if (event) {
        console.log({event}, callObject.participants())
        dispatch({
          type: PARTICIPANTS_CHANGE,
          participants: callObject.participants(),
        });
      }
    }

    // Use initial state
    handleNewParticipantsState();

    // Listen for changes in state
    for (const event of events) {
      callObject.on(event, handleNewParticipantsState);
    }

    // Stop listening for changes in state
    return function cleanup() {
      for (const event of events) {
        callObject.off(event, handleNewParticipantsState);
      }
    };
  }, [callObject]);

  /**
   * Start listening for call errors, when the callObject is set.
   */
  useEffect(() => {
    if (!callObject) return;

    function handleCameraErrorEvent(event) {
      dispatch({
        type: CAM_OR_MIC_ERROR,
        message:
          (event && event.errorMsg && event.errorMsg.errorMsg) || 'Unknown',
      });
    }

    // We're making an assumption here: there is no camera error when callObject
    // is first assigned.

    callObject.on('camera-error', handleCameraErrorEvent);

    return function cleanup() {
      callObject.off('camera-error', handleCameraErrorEvent);
    };
  }, [callObject]);

  /**
   * Start listening for fatal errors, when the callObject is set.
   */
  useEffect(() => {
    if (!callObject) return;

    function handleErrorEvent(e) {
      dispatch({
        type: FATAL_ERROR,
        message: (e && e.errorMsg) || 'Unknown',
      });
    }

    // We're making an assumption here: there is no error when callObject is
    // first assigned.

    callObject.on('error', handleErrorEvent);

    return function cleanup() {
      callObject.off('error', handleErrorEvent);
    };
  }, [callObject]);

  /**
   * Start a timer to show the "click allow" message, when the component mounts.
   */
  useEffect(() => {
    const t = setTimeout(() => {
      dispatch({ type: CLICK_ALLOW_TIMEOUT });
    }, 2500);

    return function cleanup() {
      clearTimeout(t);
    };
  }, []);

  // useEffect(() => {
  //   getTiles();
  // }, [callObject])

  function getTiles() {
    const largeTiles = [];
    const smallTiles = [];
    Object.entries(callState.callItems).forEach(([id, callItem]) => {
      console.log({ callItem });
      const isLarge = isLocal(id)
      const tileProps = {
        key: id,
        videoTrackState: callItem.videoTrackState,
        audioTrackState: callItem.audioTrackState,
        isLocalPerson: isLocal(id),
        isLarge,
        disableCornerMessage: isScreenShare(id),
        onClick:
          isLocal(id)
          ? null
          : () => {
            console.log(id);
          }
      }
      console.log({ tileProps })
      if (isLarge) {
        setMainView(tileProps)
      } else {
        console.log('else', { tileProps })
      }
      })
    }
      // const tile = (
      //   <Tile
      //     key={id}
      //     videoTrackState={callItem.videoTrackState}
      //     audioTrackState={callItem.audioTrackState}
      //     isLocalPerson={isLocal(id)}
      //     isLarge={isLarge}
      //     disableCornerMessage={isScreenShare(id)}
      //     onClick={
      //       isLocal(id)
      //         ? null
      //         : () => {
      //             console.log(id);
      //           }
      //     }
      //   />
      // );
  useEffect(() => {
    getTiles()
  }, [callState.callItems])
  return (
    <Row className="call">
      <Col md={8} className="large-tiles">
        { mainView ? <Tile { ...mainView } />: 'nada' }
      </Col>
      {/*<Col md={4} className="small-tiles">{rest}</Col>*/}
    </Row>
  );
}
