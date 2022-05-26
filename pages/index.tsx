import {
  ActionIcon,
  Box,
  Button,
  Center,
  createStyles,
  Group,
  MediaQuery,
  ScrollArea,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import {
  IconBrandAndroid,
  IconCloudOff,
  IconCloudUpload,
  IconPencil,
  IconReportMoney,
  IconShoppingCart,
  IconSortAscending,
  IconTruckDelivery,
  IconX,
} from '@tabler/icons';
import dayjs from 'dayjs';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  listAll,
  ref,
  uploadBytes,
} from 'firebase/storage';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import OverviewItem from '../components/dashboard/OverviewItem';
import HomeLayout from '../components/HomeLayout';
import LottieLoader from '../components/LottieLoader';
import {
  showErrorNotification,
  showSuccessNotification,
} from '../helpers/notification';
import Order, { orderConverter } from '../models/order';
import { productConverter } from '../models/product';
import {
  fetchUserEngagementDuration,
  fetchTotalUsers,
  fetchPageViews,
  fetchUsersByCountry,
  fetchUsersByPlatform,
} from '../services/analytics';
import IsSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import Counter from '../components/Counter';
import UserEngagementDurationChart from '../components/dashboard/UserEngagementDurationChart';
import TotalUsersChart from '../components/dashboard/TotalUsersChart';
import PageViewsChart from '../components/dashboard/PageViewsChart';
import UserWorldMap from '../components/dashboard/UserWorldMap';
import UserByCountryChart from '../components/dashboard/UserByCountryChart';
import UserByPlatformChart from '../components/dashboard/UserByPlatformChart';
import RevenuePerDayChart, {
  RevenuePerDayData,
} from '../components/dashboard/RevenuePerDayChart';

dayjs.extend(IsSameOrAfter);

/* -------------------------------------------------------------------------- */
/*                                  component                                 */
/* -------------------------------------------------------------------------- */

const Home: NextPage = () => {
  /* --------------------------------- hooks -------------------------------- */

  const [orders, setOrders] = useState<Order[]>([]);

  const [ordersLoading, setOrdersLoading] = useState(false);

  const [currentApk, setCurrentApk] = useState<{
    name: string;
    fullPath: string;
  }>();

  const [apk, setApk] = useState<File>();

  const [currentApkLoading, setCurrentApkLoading] = useState(false);

  const [apkUploadLoading, setApkUploadLoading] = useState(false);

  const [apkRemoveLoading, setApkRemoveLoading] = useState(false);

  const [totalOrders, setTotalOrders] = useState<number>();

  const [totalRevenue, setTotalRevenue] = useState<number>();

  const [totalProducts, setTotalProducts] = useState<number>();

  const [newOrders, setNewOrders] = useState<number>();

  const [revenuePerDayData, setRevenuePerDayData] = useState<
    RevenuePerDayData[]
  >([]);

  const router = useRouter();

  const { classes } = useStyles();

  const {
    data: userEngagementDurationData,
    isLoading: userEngagementDurationLoading,
  } = useQuery(
    'user-engagement-duration-analytics',
    fetchUserEngagementDuration
  );

  const { data: totalUsersData, isLoading: totalUsersLoading } = useQuery(
    'total-users-analytics',
    fetchTotalUsers
  );

  const { data: pageViewsData, isLoading: pageViewsLoading } = useQuery(
    'page-views-analytics',
    fetchPageViews
  );

  const { data: usersByCountryData, isLoading: usersByCountryLoading } =
    useQuery('users-by-country-analytics', fetchUsersByCountry);

  const { data: usersByPlatformData, isLoading: usersByPlatformLoading } =
    useQuery('users-by-platform-analytics', fetchUsersByPlatform);

  useEffect(() => {
    const getOrders = async () => {
      // get firestore
      const firestore = getFirestore();
      // create reference with converter
      const ref = collection(firestore, 'orders').withConverter(orderConverter);
      // create query
      const queryRef = query(
        ref,
        where('orderStatus', '==', 'Pending'),
        limit(10)
      );
      // get snapshot
      const snapshot = await getDocs(queryRef);
      // create array to hold orders
      const orders: Order[] = [];
      // iterate through orders
      for (const doc of snapshot.docs) {
        // get order
        const order = doc.data();
        // initialize order
        await order.initialize();
        // add order to array
        orders.push(order);
      }
      // save orders
      setOrders(orders);
      // return orders
      return orders;
    };

    const calculateRevenuePerDay = (orders: Order[]) => {
      // create data
      const data: RevenuePerDayData[] = [];
      // iterate through days
      for (
        let day = dayjs().subtract(2, 'week');
        day.isBefore(Date.now());
        day = day.add(1, 'day')
      ) {
        // add to data
        data.push({ name: day.format('D MMM'), date: day.toDate(), value: 0 });
      }
      // iterate through orders
      for (const order of orders) {
        // get index of data array
        const index = data.findIndex((data) =>
          dayjs(data.date).isSame(dayjs(order.date), 'day')
        );
        // check index exist
        if (index === -1) continue;
        // increase value
        data[index].value += order.total;
      }
      // save data
      setRevenuePerDayData(data);
    };

    (async function () {
      try {
        // start loading
        setOrdersLoading(true);
        // get orders
        const orders = await getOrders();
        // create revenue data
        calculateRevenuePerDay(orders);
      } catch (error) {
        console.log(error);
        // show notification
        showErrorNotification('Error Occurred');
      } finally {
        // stop loading
        setOrdersLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const getOrderSummary = async () => {
      // get firestore
      const firestore = getFirestore();
      // create reference with converter
      const ref = collection(firestore, 'orders').withConverter(orderConverter);
      // create query
      const queryRef = query(ref);
      // get snapshot
      const snapshot = await getDocs(queryRef);
      // save count
      setTotalOrders(snapshot.size);
      // start revenue with zero
      setTotalRevenue(0);
      // start new orders with zero
      setNewOrders(0);
      // calculate revenue
      for (const doc of snapshot.docs) {
        // get order
        const order = doc.data();
        // increase revenue
        setTotalRevenue(
          (currentRevenue) => currentRevenue! + Number(order.total)
        );
        // check order is placed after today
        if (dayjs(order.date).isSameOrAfter(Date.now(), 'day')) {
          // increment new orders count
          setNewOrders((count) => count! + 1);
        }
      }
    };

    const getProductSummary = async () => {
      // get firestore
      const firestore = getFirestore();
      // create reference with converter
      const ref = collection(firestore, 'products').withConverter(
        productConverter
      );
      // create query
      const queryRef = query(ref);
      // get snapshot
      const snapshot = await getDocs(queryRef);
      // save count
      setTotalProducts(snapshot.size);
    };

    (async function () {
      try {
        // get user
        await getOrderSummary();
      } catch (error) {
        console.log(error);
      }
    })();
    (async function () {
      try {
        // get user
        await getProductSummary();
      } catch (error) {
        console.log(error);
      }
    })();
  }, []);

  useEffect(() => {
    const getCurrentApk = async () => {
      const storage = getStorage();
      // create listing ref
      const listRef = ref(storage, 'package');
      // list current packages
      const list = await listAll(listRef);
      // get first package
      const apk = list.items[0];
      // check apk exist
      if (!apk) return;
      // save apk details
      setCurrentApk({ name: apk.name, fullPath: apk.fullPath });
    };

    (async function () {
      try {
        // start loading
        setCurrentApkLoading(true);
        // get apk
        await getCurrentApk();
      } catch (error) {
        console.log(error);
        // show notification
        showErrorNotification('Error Occurred');
      } finally {
        // stop loading
        setCurrentApkLoading(false);
      }
    })();
  }, []);

  /* ------------------------------- handlers ------------------------------- */

  const editOrder = (index: number) => {
    // get order
    const order = orders[index];
    // go to edit screen
    router.push(`/orders/${order.id}`);
  };

  const updatePackageLink = async (link: string) => {
    // get firestore
    const firestore = getFirestore();
    // create reference with converter
    const ref = doc(firestore, 'package', 'package');
    // add document to the database
    await setDoc(ref, { link });
  };

  const uploadApk = async (): Promise<void> => {
    try {
      // check apk is empty
      if (!apk) return;
      // start loading
      setApkUploadLoading(true);
      // get storage
      const storage = getStorage();
      // create reference
      const apkRef = ref(storage, `package/${apk.name}`);
      // upload file
      await uploadBytes(apkRef, apk);
      // get download url
      const downloadUrl = await getDownloadURL(apkRef);
      // update package document
      await updatePackageLink(downloadUrl);
      // show success notification
      showSuccessNotification('Successfully uploaded package');
      // remove selected apk
      setApk(undefined);
      // set current apk
      setCurrentApk({ name: apkRef.name, fullPath: apkRef.fullPath });
    } catch (error) {
      console.log(error);
      showErrorNotification('Error Occurred..');
    } finally {
      // stop loading
      setApkUploadLoading(false);
    }
  };

  const removeApk = async (): Promise<void> => {
    try {
      // check apk is empty
      if (!currentApk) return;
      // start loading
      setApkRemoveLoading(true);
      // get storage
      const storage = getStorage();
      // create reference
      const apkRef = ref(storage, currentApk.fullPath);
      // remove file
      await deleteObject(apkRef);
      // update package document
      await updatePackageLink('');
      // show success notification
      showSuccessNotification('Successfully removed package');
      // remove current apk
      setCurrentApk(undefined);
    } catch (error) {
      console.log(error);
      showErrorNotification('Error Occurred..');
    } finally {
      // stop loading
      setApkRemoveLoading(false);
    }
  };

  /* -------------------------------- helpers ------------------------------- */

  const orderItems = orders.map((element, index) => (
    <tr key={index}>
      <td style={{ whiteSpace: 'nowrap' }}>{element.orderId}</td>
      {/* <td style={{ whiteSpace: 'nowrap' }}>{element.products.length}</td> */}
      {/* <td style={{ whiteSpace: 'nowrap' }}>LKR {element.total}</td> */}
      {/* <td style={{ whiteSpace: 'nowrap' }}>
        <Group align="center" spacing={12}>
          <ColorSwatch
            mb={2}
            size={10}
            color={deliveryStepColor(element.status)}
          />
          <Text size="sm">{element.status}</Text>
        </Group>
      </td> */}
      <td style={{ whiteSpace: 'nowrap' }}>{element.user?.userName}</td>
      <td>
        <Center>
          <ActionIcon
            variant="light"
            color="accent"
            radius="xl"
            size="lg"
            onClick={() => editOrder(index)}
          >
            <IconPencil />
          </ActionIcon>
        </Center>
      </td>
    </tr>
  ));

  const orderTable = (
    <Stack py={12} px={8} className={classes.ordersCard} spacing={0}>
      <Text align="center" color="gray" weight={500}>
        Latest Orders
      </Text>
      {ordersLoading && (
        <Center style={{ width: '100%', height: '100%' }}>
          <LottieLoader />
        </Center>
      )}
      {!ordersLoading && orders.length > 0 && (
        <ScrollArea style={{ width: '100%', flexGrow: 1 }}>
          <Table
            verticalSpacing="sm"
            style={{ width: '100%' }}
            highlightOnHover
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>Ordered By</th>
                {/* <th>Status</th> */}
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>{orderItems}</tbody>
          </Table>
        </ScrollArea>
      )}
    </Stack>
  );

  const androidApkUploadView = apk ? (
    <Stack align="stretch" spacing={20}>
      <Group position="center" spacing={4}>
        <Text size="xs" weight={500} color="gray">
          Selected:
        </Text>
        <Text size="xs" weight={500}>
          {apk.name}
        </Text>
        <Text size="xs" weight={500} color="gray">
          ({(apk.size / (1024 * 1024)).toFixed(2)} Mb)
        </Text>
      </Group>
      <Group>
        <Button
          loading={apkUploadLoading}
          leftIcon={<IconCloudUpload />}
          style={{ flexGrow: 1 }}
          onClick={uploadApk}
        >
          Upload
        </Button>
        <Button
          variant="outline"
          leftIcon={<IconX />}
          onClick={() => setApk(undefined)}
        >
          Cancel
        </Button>
      </Group>
    </Stack>
  ) : (
    <Dropzone
      multiple={false}
      onDrop={(files) => {
        setApk(files[0]);
      }}
      onReject={(rejections) => {
        console.log(rejections);
      }}
      maxSize={5 * 1024 ** 2}
    >
      {(status) => (
        <Stack align="center" spacing={8}>
          <IconBrandAndroid size={60} color="gray" />
          <Text size="xs" color="gray" align="center">
            Drop package here or click to upload
          </Text>
        </Stack>
      )}
    </Dropzone>
  );

  const androidCurrentApk = (
    <Stack align="stretch" spacing={20}>
      <Group position="center" spacing={4}>
        <Text size="xs" weight={500} color="gray">
          Current:
        </Text>
        <Text size="xs" weight={500}>
          {currentApk?.name}
        </Text>
      </Group>
      <Group>
        <Button
          variant="outline"
          loading={apkRemoveLoading}
          leftIcon={<IconCloudOff />}
          style={{ flexGrow: 1 }}
          onClick={removeApk}
        >
          Remove
        </Button>
      </Group>
    </Stack>
  );

  const androidApkUploader = (
    <Stack align="stretch" p={20} className={classes.apkCard}>
      <Text align="center" weight={500}>
        AR Package
      </Text>
      {currentApkLoading ? (
        <LottieLoader />
      ) : currentApk ? (
        androidCurrentApk
      ) : (
        androidApkUploadView
      )}
    </Stack>
  );

  const overviewItems = (
    <Group className={classes.overviewWrapper} px={44} spacing={40}>
      <Group className={classes.overViewRow} spacing={40}>
        <OverviewItem
          icon={<IconTruckDelivery />}
          title="Total Orders"
          value={totalOrders != null ? <Counter count={totalOrders} /> : '_'}
          href="/orders"
        />
        <OverviewItem
          icon={<IconReportMoney />}
          title="Total Revenue"
          value={
            totalRevenue != null ? (
              <Group spacing={4}>
                <Text weight={500}>LKR</Text>
                <Counter count={totalRevenue} />
              </Group>
            ) : (
              '_'
            )
          }
          href="/orders"
        />
      </Group>
      <Group className={classes.overViewRow} spacing={40}>
        <OverviewItem
          icon={<IconShoppingCart />}
          title="Total Products"
          value={
            totalProducts != null ? <Counter count={totalProducts} /> : '_'
          }
          href="/products"
        />
        <OverviewItem
          icon={<IconSortAscending />}
          title="New Orders"
          value={newOrders != null ? <Counter count={newOrders} /> : '_'}
          href="/orders"
        />
      </Group>
    </Group>
  );

  const pageViewsChart = (
    <Stack className={classes.analyticsRow1Chart} align="center" spacing={0}>
      <PageViewsChart loading={pageViewsLoading} data={pageViewsData ?? []} />
      <Text size="sm" color="gray" weight={500}>
        Page Views
      </Text>
    </Stack>
  );

  const userPlatformChart = (
    <Stack className={classes.analyticsRow1Chart} align="center" spacing={0}>
      <UserByPlatformChart
        loading={usersByPlatformLoading}
        data={usersByPlatformData ?? []}
      />
      <Text size="sm" color="gray" weight={500}>
        User Platform
      </Text>
    </Stack>
  );

  const userEngagementDurationChart = (
    <Stack align="center" style={{ height: 300 }} spacing={0}>
      <UserEngagementDurationChart
        loading={userEngagementDurationLoading}
        data={userEngagementDurationData ?? []}
      />
      <Text size="sm" color="gray" weight={500}>
        User Engagement Duration
      </Text>
    </Stack>
  );

  const totalUsersChart = (
    <Stack align="center" style={{ height: 300 }} spacing={0}>
      <TotalUsersChart
        loading={totalUsersLoading}
        data={totalUsersData ?? []}
      />
      <Text size="sm" color="gray" weight={500}>
        Total Users
      </Text>
    </Stack>
  );

  const revenuePerDayChart = (
    <Stack align="center" style={{ height: 300 }} spacing={0}>
      <RevenuePerDayChart
        loading={ordersLoading}
        data={revenuePerDayData ?? []}
      />
      <Text size="sm" color="gray" weight={500}>
        Revenue
      </Text>
    </Stack>
  );

  const usersByCountryCharts = (
    <Group className={classes.userByCountryCharts}>
      <Box className={classes.userWorldMap}>
        <UserWorldMap data={usersByCountryData ?? []} />
      </Box>
      <Box className={classes.userByCountryChart}>
        <UserByCountryChart
          loading={usersByCountryLoading}
          data={usersByCountryData ?? []}
        />
      </Box>
    </Group>
  );

  const analytics = (
    <Stack className={classes.analyticsWrapper} mr={16} spacing={40}>
      <Group className={classes.analyticsRow1}>
        {pageViewsChart}
        {userPlatformChart}
      </Group>
      {userEngagementDurationChart}
      {totalUsersChart}
      {revenuePerDayChart}
      <Stack
        align="center"
        className={classes.userByCountryChartsWrapper}
        spacing={0}
      >
        {usersByCountryCharts}
        <Text
          className={classes.usersByCountryText}
          size="sm"
          color="gray"
          weight={500}
        >
          Users By Countries
        </Text>
      </Stack>
    </Stack>
  );

  const content = (
    <Stack py={30} className={classes.content} spacing={32}>
      {overviewItems}
      <Group
        className={classes.row2Wrapper}
        pr={44}
        spacing={20}
        align="stretch"
        style={{
          width: '100%',
          height: '100%',
          flexGrow: 1,
          overflow: 'hidden',
        }}
      >
        <MediaQuery largerThan="xl" styles={{ display: 'none' }}>
          {analytics}
        </MediaQuery>
        <MediaQuery smallerThan="xl" styles={{ display: 'none' }}>
          <ScrollArea style={{ width: '100%', height: '100%' }}>
            {analytics}
          </ScrollArea>
        </MediaQuery>
        <Stack className={classes.ordersWrapper} spacing={20}>
          {orderTable}
          {androidApkUploader}
        </Stack>
      </Group>
    </Stack>
  );

  /* -------------------------------- render -------------------------------- */

  return (
    <Center style={{ width: '100%', height: '100%' }}>
      {/* head */}
      <Head>
        <title>Smart Ecommerce Store Admin - Dashboard</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* body */}
      <MediaQuery largerThan="xl" styles={{ display: 'none' }}>
        <ScrollArea style={{ width: '100%', height: '100%' }}>
          {content}
        </ScrollArea>
      </MediaQuery>
      <MediaQuery smallerThan="xl" styles={{ display: 'none' }}>
        {content}
      </MediaQuery>
    </Center>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   styles                                   */
/* -------------------------------------------------------------------------- */

const useStyles = createStyles((theme) => {
  return {
    content: {
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      [`@media (max-width: ${theme.breakpoints.xl}px)`]: {
        height: 'auto',
      },
    },
    overviewWrapper: {
      flex: 'none',
      [`@media (max-width: ${theme.breakpoints.lg}px)`]: {
        gap: 20,
        paddingRight: 20,
        paddingLeft: 20,
      },
      [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
        flexDirection: 'column',
      },
    },
    overViewRow: {
      width: '100%',
      [`@media (max-width: ${theme.breakpoints.lg}px)`]: {
        flexDirection: 'column',
        gap: 20,
      },
    },
    overviewCard: {
      width: 200,
      border: `2px solid ${theme.colors.gray[4]}`,
      borderRadius: 8,
      flex: 'none',
    },
    ordersCard: {
      width: '100%',
      border: `2px solid ${theme.colors.gray[4]}`,
      borderRadius: 8,
      flexGrow: 1,
      overflow: 'hidden',
      [`@media (max-width: ${theme.breakpoints.xl}px)`]: {
        gap: 16,
      },
    },
    apkCard: {
      width: '100%',
      border: `2px solid ${theme.colors.gray[4]}`,
      borderRadius: 8,
    },
    row2Wrapper: {
      [`@media (max-width: ${theme.breakpoints.xl}px)`]: {
        height: 'auto',
        paddingRight: 44,
        paddingLeft: 44,
        flexDirection: 'column',
      },
      [`@media (max-width: ${theme.breakpoints.lg}px)`]: {
        paddingRight: 20,
        paddingLeft: 20,
      },
    },
    analyticsWrapper: {
      [`@media (max-width: ${theme.breakpoints.xl}px)`]: {
        marginRight: 0,
      },
    },
    analyticsRow1: {
      height: 300,
      [`@media (max-width: ${theme.breakpoints.lg}px)`]: {
        flexDirection: 'column',
        height: 600,
      },
    },
    analyticsRow1Chart: {
      height: '100%',
      width: '100%',
      [`@media (max-width: ${theme.breakpoints.lg}px)`]: {
        height: 300,
      },
    },
    userByCountryChartsWrapper: {
      height: 500,
      [`@media (max-width: ${theme.breakpoints.lg}px)`]: {
        height: 850,
        gap: 20,
      },
    },
    userByCountryCharts: {
      height: '100%',
      width: '100%',
      [`@media (max-width: ${theme.breakpoints.lg}px)`]: {
        flexDirection: 'column',
        gap: 0,
      },
    },
    userWorldMap: {
      height: '100%',
      width: '70%',
      [`@media (max-width: ${theme.breakpoints.lg}px)`]: {
        height: 500,
        width: '100%',
      },
    },
    userByCountryChart: {
      height: '100%',
      width: '30%',
      [`@media (max-width: ${theme.breakpoints.lg}px)`]: {
        flexDirection: 'column',
        height: 300,
        width: '100%',
      },
    },
    usersByCountryText: {
      marginTop: -20,
      [`@media (max-width: ${theme.breakpoints.lg}px)`]: {
        marginTop: 0,
      },
    },
    ordersWrapper: {
      width: '30%',
      [`@media (max-width: ${theme.breakpoints.xl}px)`]: {
        width: '100%',
        marginTop: 12,
      },
    },
  };
});

/* -------------------------------------------------------------------------- */
/*                                   exports                                  */
/* -------------------------------------------------------------------------- */

(Home as any).Layout = HomeLayout;

export default Home;
