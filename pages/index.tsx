import { Center, Text } from '@mantine/core';
import type { NextPage } from 'next';
import HomeLayout from '../components/HomeLayout';

/* -------------------------------------------------------------------------- */
/*                                  component                                 */
/* -------------------------------------------------------------------------- */

const Home: NextPage = () => {
  return (
    <Center style={{ width: '100%', height: '100%' }}>
      <Text>Nothing here yet..</Text>
    </Center>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   exports                                  */
/* -------------------------------------------------------------------------- */

(Home as any).Layout = HomeLayout;

export default Home;
