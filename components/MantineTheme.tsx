import React, { ReactNode } from 'react';
import { Global, MantineProvider, MantineThemeOverride } from '@mantine/core';
import { NotificationsProvider } from '@mantine/notifications';

interface Props {
  children: ReactNode;
}

const MantineTheme = ({ children }: Props): JSX.Element => {
  /* --------------------------------- hooks -------------------------------- */

  const theme: MantineThemeOverride = {
    fontFamily: ['Montserrat'].join(','),
  };

  /* -------------------------------- render -------------------------------- */

  return (
    <MantineProvider
      withNormalizeCSS
      withGlobalStyles
      theme={theme}
      defaultProps={{}}
      styles={{
        TextInput: (theme) => ({
          error: {
            fontSize: theme.fontSizes.xs,
          },
        }),
        PasswordInput: (theme) => ({
          error: {
            fontSize: theme.fontSizes.xs,
          },
        }),
      }}
    >
      <Global
        styles={(theme) => ({
          body: {
            height: '100vh',
            fontFamily: theme.fontFamily,
          },
          '#__next': {
            height: '100%',
          },
          '.firebase-emulator-warning': {
            opacity: 0,
            pointerEvents: 'none',
          },
        })}
      />
      <NotificationsProvider>{children}</NotificationsProvider>
    </MantineProvider>
  );
};

export default MantineTheme;