import React, { useEffect, useMemo, useRef, useState } from 'react';
import Badge from 'reactstrap/lib/Badge'
import './Tile.css';
import Person from '../../assets/person.png';
import { auth } from '../../services/firebase';
import { fetchUserDetails } from '../../services/fb-helpers';

function getTrackUnavailableMessage(kind, trackState) {
  if (!trackState) return;
  switch (trackState.state) {
    case 'blocked':
      if (trackState.blocked.byPermissions) {
        return `${kind} permission denied`;
      }
      if (trackState.blocked.byDeviceMissing) {
        return `${kind} device missing`;
      }
      return `${kind} blocked`;
    case 'off':
      if (trackState.off.byUser) {
        return `${kind} muted`;
      }
      if (trackState.off.byBandwidth) {
        return `${kind} muted to save bandwidth`;
      }
      return `${kind} off`;
    case 'sendable':
      return `${kind} not subscribed`;
    case 'loading':
      return `${kind} loading...`;
    case 'interrupted':
      return `${kind} interrupted`;
    case 'playable':
      return null;
  }
}

/**
 * Props
 * - videoTrackState: DailyTrackState?
 * - audioTrackState: DailyTrackState?
 * - isLocalPerson: boolean
 * - isLarge: boolean
 * - disableCornerMessage: boolean
 * - onClick: Function
 */
export default function Tile(props) {
  const videoEl = useRef(null);
  const audioEl = useRef(null);
  const [userDetails, setUser] = useState({
    uid: '',
    displayName: '',
    role: '',
  });

  const fetchUser = async () => {
    const { userId } = props;
    const userRes = await fetchUserDetails(userId);
    if (!userRes || !userId) setUser({ ...userDetails, displayName: userId });
    else setUser({ uid: userId, ...userRes });
    console.log({ userId, userRes });
  };

  useState(() => {
    fetchUser();
  }, [props.userId]);

  const videoTrack = useMemo(() => {
    return props.videoTrackState && props.videoTrackState.state === 'playable'
      ? props.videoTrackState.track
      : null;
  }, [props.videoTrackState]);

  const audioTrack = useMemo(() => {
    return props.audioTrackState && props.audioTrackState.state === 'playable'
      ? props.audioTrackState.track
      : null;
  }, [props.audioTrackState]);

  const videoUnavailableMessage = useMemo(() => {
    return getTrackUnavailableMessage('video', props.videoTrackState);
  }, [props.videoTrackState]);

  const audioUnavailableMessage = useMemo(() => {
    return getTrackUnavailableMessage('audio', props.audioTrackState);
  }, [props.audioTrackState]);

  /**
   * When video track changes, update video srcObject
   */
  useEffect(() => {
    videoEl.current &&
      (videoEl.current.srcObject = new MediaStream([videoTrack]));
  }, [videoTrack]);

  /**
   * When audio track changes, update audio srcObject
   */
  useEffect(() => {
    audioEl.current &&
      (audioEl.current.srcObject = new MediaStream([audioTrack]));
  }, [audioTrack]);

  function getVideoComponent() {
    return (
      videoTrack && (
        <video width="350px" autoPlay muted playsInline ref={videoEl} />
      )
    );
  }

  function getAudioComponent() {
    return (
      !props.isLocalPerson &&
      audioTrack && <audio autoPlay playsInline ref={audioEl} />
    );
  }

  function getOverlayComponent() {
    // Show overlay when video is unavailable. Audio may be unavailable too.
    return (
      videoUnavailableMessage && (
        <p className="overlay">
          {videoUnavailableMessage}
          {audioUnavailableMessage && (
            <>
              <br />
              {audioUnavailableMessage}
            </>
          )}
        </p>
      )
    );
  }

  function getCornerMessageComponent() {
    // Show corner message when only audio is unavailable.
    return (
      <Badge
        outline
        color={'primary'}
        style={{
          position: 'absolute',
          top: '5px',
          right: '5px',
          visibility: props.isLocalPerson ? 'hidden' : 'visible',
          display: props.isLocalPerson ? 'none' : 'block',
          color: 'white',
        }}
        className="corner"
      >
       <h6> {!props.isLocalPerson && userDetails.displayName}</h6>
      </Badge>
    );
  }

  function getStyles() {
    if (props.isLocalPerson) {
      return {
        left: '24px',
        position: 'relative',
        top: '5px',
      };
    }
    return {
      border: '2pxx red dashed',
      marginBottom: '20px',
      margin: '0 auto',
    };
  }

  return (
    <>
      <div
        style={{
          position: 'relative',
          minHeight: '225px',
          maxHeight: '225px',
          minWidth: '400px',
          maxWidth: '400px',
          // backgroundColor: 'black',
          backgroundImage: `url('https://shapeai-uploads.s3.ap-south-1.amazonaws.com/person.png')`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          cursor: 'pointer',
          ...getStyles(),
        }}
        onClick={props.onClick}
      >
        <div className="background" />
        {getOverlayComponent()}
        {getVideoComponent()}
        {getAudioComponent()}
        {getCornerMessageComponent()}
      </div>
    </>
  );
}
