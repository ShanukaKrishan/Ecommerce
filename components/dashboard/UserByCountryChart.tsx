import { Center } from '@mantine/core';
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  YAxis,
  XAxis,
  Tooltip,
  Bar,
} from 'recharts';
import { UsersByCountryData } from '../../pages/api/analytics/users-by-country';
import LottieLoader from '../LottieLoader';

interface Props {
  loading: boolean;
  data: UsersByCountryData[];
}

const UserByCountryChart = ({ loading, data }: Props): JSX.Element => {
  return loading ? (
    <Center style={{ width: '100%', height: '100%' }}>
      <LottieLoader />
    </Center>
  ) : (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart layout="vertical" data={data} barSize={10}>
        <YAxis
          type="category"
          dataKey="country"
          style={{ fontSize: 10, fontWeight: 500 }}
        />
        <XAxis
          type="number"
          allowDecimals={false}
          style={{ fontSize: 10, fontWeight: 500 }}
        />
        <Tooltip />
        <Bar name="Total Users" dataKey="value" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default UserByCountryChart;
