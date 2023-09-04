import React, { useState } from 'react';
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  NavbarText,
  Button,
} from 'reactstrap';
import { auth } from '../services/firebase';
import { useHistory } from 'react-router-dom';

const NammaNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);
  const history = useHistory();

  return (
    <Navbar style={{
      boxShadow :
      `0px 0.7px 1.9px rgba(0, 0, 0, 0.041),
      0px 1.6px 4.3px rgba(0, 0, 0, 0.06),
      0px 2.9px 7.7px rgba(0, 0, 0, 0.074),
      0px 4.8px 12.8px rgba(0, 0, 0, 0.086),
      0px 7.9px 21.2px rgba(0, 0, 0, 0.1),
      0px 13.9px 37px rgba(0, 0, 0, 0.119),
      0px 30px 80px rgba(0, 0, 0, 0.16)`,
      position: 'relative'

    }} color="" light expand="md">
      <NavbarBrand className={'justify-content-center'} href="/">
       <img width={'75'} src={'https://shapeai-uploads.s3.ap-south-1.amazonaws.com/lab-ez-logo.png'} />
      </NavbarBrand>
      <Button color={'danger'} style={{
        position: 'absolute',
        right: '20px'
      }} onClick={() => {
        // eslint-disable-next-line promise/always-return
        auth().signOut().then(() => {
          history.push('/auth');
        });
      }} >
        Logout
      </Button>
      <NavbarToggler onClick={toggle} />
      {/*<Collapse isOpen={isOpen} navbar>*/}
      {/*  <Nav className="mr-auto" navbar>*/}
      {/*    <NavItem>*/}
      {/*      <NavLink href="/components/">Components</NavLink>*/}
      {/*    </NavItem>*/}
      {/*    <NavItem>*/}
      {/*      <NavLink href="https://github.com/reactstrap/reactstrap">GitHub</NavLink>*/}
      {/*    </NavItem>*/}
      {/*    <UncontrolledDropdown nav inNavbar>*/}
      {/*      <DropdownToggle nav caret>*/}
      {/*        Options*/}
      {/*      </DropdownToggle>*/}
      {/*      <DropdownMenu right>*/}
      {/*        <DropdownItem>*/}
      {/*          Option 1*/}
      {/*        </DropdownItem>*/}
      {/*        <DropdownItem>*/}
      {/*          Option 2*/}
      {/*        </DropdownItem>*/}
      {/*        <DropdownItem divider />*/}
      {/*        <DropdownItem>*/}
      {/*          Reset*/}
      {/*        </DropdownItem>*/}
      {/*      </DropdownMenu>*/}
      {/*    </UncontrolledDropdown>*/}
      {/*  </Nav>*/}
      {/*  <NavbarText>Simple Text</NavbarText>*/}
      {/*</Collapse>*/}
    </Navbar>
  );
}

export default NammaNavbar;
