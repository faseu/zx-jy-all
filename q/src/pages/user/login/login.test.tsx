import { startMock } from '@@/requestRecordMock';
import { TestBrowser } from '@@/testBrowser';
import { fireEvent, render } from '@testing-library/react';
import React, { act } from 'react';

const waitTime = (time: number = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

let server: {
  close: () => void;
};

describe('Login Page', () => {
  beforeAll(async () => {
    server = await startMock({
      port: 8000,
      scene: 'login',
    });
  });

  afterAll(() => {
    server?.close();
  });

  it('should show login form', async () => {
    const historyRef = React.createRef<any>();
    const rootContainer = render(
      <TestBrowser
        historyRef={historyRef}
        location={{
          pathname: '/user/login',
        }}
      />
    );

    await rootContainer.findAllByText('Salam');

    act(() => {
      historyRef.current?.push('/user/login');
    });

    expect(rootContainer.baseElement?.querySelector('.ant-pro-form-login-desc')?.textContent).toBe(
      'Salam, Welcome toJamming Managment System'
    );

    expect(rootContainer.asFragment()).toMatchSnapshot();

    rootContainer.unmount();
  });

  it('should login success', async () => {
    const historyRef = React.createRef<any>();
    const rootContainer = render(
      <TestBrowser
        historyRef={historyRef}
        location={{
          pathname: '/user/login',
        }}
      />
    );

    await rootContainer.findAllByText('Salam');

    const userNameInput = await rootContainer.findByPlaceholderText('Username');

    act(() => {
      fireEvent.change(userNameInput, { target: { value: 'admin' } });
    });

    const passwordInput = await rootContainer.findByPlaceholderText('Password');

    act(() => {
      fireEvent.change(passwordInput, { target: { value: 'ant.design' } });
    });

    await (await rootContainer.findByText('Login')).click();

    // Wait for the mocked API response.
    await waitTime(5000);

    await rootContainer.findAllByText('Salam');

    expect(rootContainer.asFragment()).toMatchSnapshot();

    await waitTime(2000);

    rootContainer.unmount();
  });
});
