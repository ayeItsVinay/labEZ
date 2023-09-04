import React, { useEffect, useContext, useReducer, useCallback, useState } from 'react';
import './Call.css';
import {Row, Col, Container, Card, CardHeader} from 'reactstrap';
import Tile from '../Tile/Tile';
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
import { logDailyEvent } from '../../logUtils';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/theme-terminal';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-csharp';
import 'ace-builds/src-noconflict/snippets/csharp';
import 'ace-builds/src-noconflict/snippets/javascript';

import Toggle from 'react-toggle';
import Button from 'reactstrap/lib/Button';

import { db, auth } from '../../services/firebase';
import {executeScript} from '../../services/api';


const getPBDBPath = (uid, pbTitle) => `/codes/${localStorage.getItem('labSessionId')}/${uid}/${pbTitle}`;

const setPBCode = (uid, pbTitle, script) => {
  return new Promise((resolve, reject) => {
    db.ref(getPBDBPath(uid, pbTitle)).set({ script })
      .then(() => resolve());
  });
};

const fetchPBScript = async (uid, pbTitle) => {
  console.log({uid, pbTitle})
  return new Promise((resolve, reject) => {
    db.ref(getPBDBPath(uid, pbTitle)).once('value', (snapshot) => {
      console.log('sss', snapshot.val())
      resolve(snapshot.val());
    });
  });
};

export default function Call({ selectedPB, execLanguage }) {
  const callObject = useContext(CallObjectContext);
  const [callState, dispatch] = useReducer(callReducer, initialCallState);
  const [toggleOn, setToggle] = useState(false);
  const [script, setScript] = useState('');
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('');
  const [appUser, setUser] = useState({ claims: { teacher: false } });
  const [listeningPBPath, setListeningPBPath] = useState('');

  useEffect(() => {
    auth().onAuthStateChanged((loggedInUser) => {
        auth()
          .currentUser.getIdTokenResult()
          .then((iDtokenResult) => {
            setUser({
              ...loggedInUser,
              teacher: iDtokenResult?.claims?.teacher,
            });
          });
    });
  }, []);

  useEffect(() => {
    if (appUser.teacher && listeningPBPath)
    db.ref(listeningPBPath).on('value', snap => {
      setScript((snap.val()).script)
    });

  }, [appUser, listeningPBPath]);

  useEffect(() => {
    console.log('fefe', { appUser })
  }, [appUser])

  useEffect(() => {
    if (appUser.uid)
    setPBCode(appUser.uid, selectedPB.title, script);
  }, [script]);
  const runScript = async () => {
    try {
      const res = await executeScript(execLanguage, script, stdin);
      setOutput(res.data.output);
    } catch (e) {
      console.log(e)
    }

  }
  // useEffect(() => {
  //
  // }, [selectedPB]);
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
      event && logDailyEvent(event);
      dispatch({
        type: PARTICIPANTS_CHANGE,
        participants: callObject.participants(),
      });
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
      logDailyEvent(event);
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
      logDailyEvent(e);
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

  /**
   * Send an app message to the remote participant whose tile was clicked on.
   */
  const sendHello = useCallback(
    (participantId) => {
      callObject &&
        callObject.sendAppMessage({ hello: 'world' }, participantId);
    },
    [callObject]
  );

  function getTiles() {
    const largeTiles = [];
    const smallTiles = [];
    Object.entries(callState.callItems).forEach(([id, callItem]) => {
      const users = callObject.participants();
      const user = users[id];
      console.log({ users, user, id });
      const isLarge =
        isScreenShare(id) ||
        (!isLocal(id) && !containsScreenShare(callState.callItems));
      const tile = (
        <Tile
          key={id}
          userId={user?.user_name || ''}
          videoTrackState={callItem.videoTrackState}
          audioTrackState={callItem.audioTrackState}
          isLocalPerson={isLocal(id)}
          isLarge={isLarge}
          disableCornerMessage={isScreenShare(id)}
          onClick={
            appUser?.teacher ?
              () => {
              setListeningPBPath(getPBDBPath(user?.user_name, selectedPB.title))
              } : null
          }
        />
      );
      if (isLarge) {
        largeTiles.push(tile);
      } else {
        smallTiles.push(tile);


      }
    });
    return [largeTiles, smallTiles];
  }

  const [largeTiles, smallTiles] = getTiles();
  const message = getMessage(callState);
  return (
    <div style={{
      height: '80vh'
    }} className="call">
      <Row style={{
        width: '100%'
      }} >
        <Col md="8">
          <AceEditor
            style={{ margin: '24px' }}
            width={'100%'}
            placeholder="Write your code here!"
            mode="csharp"
            theme="kuroir"
            name="blah2"
            value={script}
            // onLoad={() => console.log('editor loaded')}
            onChange={(v) => setScript(v)}
            fontSize={16}
            showPrintMargin={true}
            showGutter={true}
            highlightActiveLine={true}
            readOnly={appUser?.teacher}
            setOptions={{
              enableSnippets: false,
              showLineNumbers: true,
              tabSize: 2,
            }}
          />
          <div style={{ paddingLeft: '24px', display: 'table' }} >
            <span style={{
              display: 'table-cell',
              verticalAlign: 'middle',
              paddingRight: '5px'
            }} >Camera</span>
            <Toggle
              defaultChecked={false}
              icons={false}
              onChange={(l) => setToggle(l.target.checked) } />
          `  <span   style={{
            display: 'table-cell',
            verticalAlign: 'middle',
            paddingLeft: '5px'
          }}  >Input/Output</span>
         </div>
          <div
            style={{
              display: toggleOn ? 'none': 'block'
            }}
            className="small-tiles"
          >
            {smallTiles}
          </div>
          <Row style={{
            display: !toggleOn ? 'none': 'flex',
            height: '25%'
          }} >
            <Col md={'5'} style={{ marginLeft: '20px' }}  >
              <Card style={{
                height: '110%',
                backgroundColor: 'black',
                fontWeight: 900,
                color: 'antiquewhite',
                position: 'relative',
              }}>
                <p>Stdin</p>
                <Button style={{ position: 'absolute', right: '0', top: '0' }} color={'warning'} onClick={() => setStdin('')} >
                  <img width={'10'} src={'https://shapeai-uploads.s3.ap-south-1.amazonaws.com/undo.png'} />
                </Button>
              <AceEditor
                width={'100%'}
                height={'100%'}
                placeholder="Enter the input here"
                mode="bash"
                theme="terminal"
                name="blah2"
                value={stdin}
                // onLoad={() => console.log('editor loaded')}
                onChange={(v) => setStdin(v)}
                fontSize={18}
                showPrintMargin={true}
                showGutter={true}
                highlightActiveLine={true}
                style={{ zIndex: 0 }}
                setOptions={{
                  showLineNumbers: true,
                  tabSize: 2,
                }}/>
              </Card>
            </Col>
            <Col md={'1'} style={{ padding: '1', position: 'relative' }} >

              <Button
                block
                outline
                color={'primary'}
                onClick={runScript}
                style={{
                  margin: 0,
                  position: 'absolute',
                  top: '50%',
                }}
              >Run</Button>


            </Col>
            <Col md={'5'} style={{   marginLeft: '12px' }} >
              <Card style={{ display: 'inline-block', height: '90%', width: '100%',
                backgroundColor: 'black',
                fontWeight: 900,
                color: 'antiquewhite',
                position: 'relative'
              }}  >
                <p>Output</p>
                <Button style={{ position: 'absolute', right: '0', top: '0' }} color={'warning'} onClick={() => setOutput('')} >
                  <img width={'10'} src={'https://shapeai-uploads.s3.ap-south-1.amazonaws.com/undo.png'} />
                </Button>
                <AceEditor
                  width={'100%'}
                  height={'100%'}
                  placeholder="Click Run to see the output!"
                  mode="bash"
                  theme="terminal"
                  name="blah2"
                  value={output}
                  // onLoad={() => console.log('editor loaded')}
                  // onChange={(v) => set}
                  fontSize={18}
                  showPrintMargin={true}
                  showGutter={true}
                  readOnly={true}
                  highlightActiveLine={true}
                  // style={{ zIndex: 100 }}
                  setOptions={{
                    showLineNumbers: true,
                    tabSize: 2,
                  }}/>
                {/*<textarea readOnly={true} rows={5} cols={50} style={{ resize: 'none', visibility: 'hidden' }} />*/}
              </Card>

            </Col>
          </Row>
        </Col>
        <Col style={{       height: '80vh'
        }} md="4">
          <div className="large-tiles">
            <Container
              id={'remote-tiles-container'}
              style={{
                height: '100%',
                overflow: 'auto',
                position: 'absolute',
                textAlign: '-wekbit-center',
                paddingLeft: '24px'
              }}
            >
              {largeTiles}
            </Container>
          </div>
        </Col>
      </Row>

    </div>
  );
}
