import { BetaAnalyticsDataClient } from '@google-analytics/data';
import dayjs from 'dayjs';
import { NextApiRequest, NextApiResponse } from 'next';

export interface PageViewsData {
  name: string;
  value: number;
}

const analytics = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  // create client
  const analyticsDataClient = new BetaAnalyticsDataClient();
  // create starting date
  const startDate = dayjs().subtract(2, 'week');
  // make request
  const [response] = await analyticsDataClient.runReport({
    property: `properties/316463457`,
    dateRanges: [
      { startDate: startDate.format('2022-05-01'), endDate: 'today' },
    ],
    dimensions: [{ name: 'unifiedScreenClass' }],
    metrics: [{ name: 'screenPageViews' }],
  });
  // create data
  const data: PageViewsData[] = [];
  // check response contain rows
  if (!response.rows) {
    return res.status(200).json({ success: true, data });
  }
  // iterate though rows
  for (const row of response.rows) {
    // get page name
    const pageName = row.dimensionValues?.[0].value;
    // check value exist
    if (!pageName) continue;
    // get metric value
    const metricValue = row.metricValues?.[0].value;
    // check value exist
    if (!metricValue) continue;
    // add value to data
    data.push({ name: pageName, value: Number(metricValue) });
  }
  return res.status(200).json({ success: true, data });
};

export default analytics;
