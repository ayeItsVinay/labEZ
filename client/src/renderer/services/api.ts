import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8008/v1',
});

export const signup = (data: {
  email: string;
  name: string;
  role: string;
  password: string;
}) => instance.post('/signup', data);

export const createMeetingRoom = (name: string) =>
  instance.post('/rooms', { name });

export const executeScript = (
  language: string,
  script: string,
  stdin?: string
) => instance.post('/execute-script', { language, script, stdin });
