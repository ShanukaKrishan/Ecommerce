import {
  Anchor,
  Button,
  Center,
  createStyles,
  Divider,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  useMantineTheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconBrandFacebook, IconBrandGoogle, IconMail } from '@tabler/icons';
import { NextPage } from 'next';
import React from 'react';
import { motion } from 'framer-motion';
import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';
import { FirebaseError } from '@firebase/util';
import { useRouter } from 'next/router';
import {
  showErrorNotification,
  showSuccessNotification,
} from '../helpers/notification';

/* -------------------------------------------------------------------------- */
/*                                  component                                 */
/* -------------------------------------------------------------------------- */

const Login: NextPage = () => {
  /* --------------------------------- hooks -------------------------------- */

  const router = useRouter();

  const theme = useMantineTheme();

  const { classes } = useStyles();

  const form = useForm({
    initialValues: {
      email: '',
      name: '',
      password: '',
      terms: true,
    },

    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
      password: (val) =>
        val.length >= 6
          ? null
          : 'Password length should be more than 6 characters',
    },
  });

  /* -------------------------------- handler ------------------------------- */

  const handleGoogleLoginClick = async (): Promise<void> => {
    try {
      // create google provider
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      // login dialog
      const result = await signInWithPopup(auth, provider);
      // check user
      if (result.user == null) return;
      // show success toast
      showSuccessNotification('Successfully Logged In');
      // navigate to home
      await router.replace('/');
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code == 'auth/popup-closed-by-user') {
          return;
        }
      }
      // show error toast
      showErrorNotification('Logged In Failed');
    }
  };

  const handleSubmit = async (values: typeof form.values) => {};

  /* -------------------------------- render -------------------------------- */

  return (
    <Center className={classes.body}>
      <Stack spacing={24} align="stretch" className={classes.content}>
        <Stack spacing={4} align="center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Text className={classes.welcomeText} weight={900}>
              Welcome Back!
            </Text>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Group spacing={8}>
              <Text size="sm" color={theme.colors.gray[6]}>
                Do not have an account yet?
              </Text>
              <Anchor size="sm">Create account</Anchor>
            </Group>
          </motion.div>
        </Stack>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Paper p="xl">
            <Stack align="stretch">
              <Stack align="stretch" spacing={8}>
                <Text size="sm">Sign in with</Text>
                <Group grow>
                  <Button
                    variant="outline"
                    leftIcon={<IconBrandGoogle />}
                    onClick={handleGoogleLoginClick}
                  >
                    Google
                  </Button>
                  <Button variant="outline" leftIcon={<IconBrandFacebook />}>
                    Facebook
                  </Button>
                </Group>
              </Stack>
              <Divider label="or continue with email" labelPosition="center" />
              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack spacing={8} align="stretch">
                  <TextInput
                    required
                    label="Email"
                    {...form.getInputProps('email')}
                  />
                  <PasswordInput
                    required
                    label="Password"
                    {...form.getInputProps('password')}
                  />
                  <Button mt={12} type="submit" leftIcon={<IconMail />}>
                    Login With Email
                  </Button>
                </Stack>
              </form>
            </Stack>
          </Paper>
        </motion.div>
      </Stack>
    </Center>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   styles                                   */
/* -------------------------------------------------------------------------- */

const useStyles = createStyles((theme) => {
  return {
    body: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.gray[2],
    },
    content: {
      width: 400,
    },
    welcomeText: {
      fontSize: 28,
    },
  };
});

/* -------------------------------------------------------------------------- */
/*                                   exports                                  */
/* -------------------------------------------------------------------------- */

export default Login;
