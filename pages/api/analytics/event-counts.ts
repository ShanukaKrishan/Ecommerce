import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { NextApiRequest, NextApiResponse } from 'next';

export interface EventCountsData {
  event: string;
  count: number;
}

const analytics = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  // create client
  const analyticsDataClient = new BetaAnalyticsDataClient();
  // make request
  const [response] = await analyticsDataClient.runReport({
    property: `properties/316463457`,
    dateRanges: [{ startDate: '2022-05-01', endDate: 'today' }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
  });
  // create data
  const data: EventCountsData[] = [];
  // check response contain rows
  if (!response.rows) {
    return res.status(200).json({ success: true, data });
  }
  // iterate though rows
  for (const row of response.rows) {
    // get platform name
    const eventName = row.dimensionValues?.[0].value;
    // check value exist
    if (!eventName) continue;
    // get metric value
    const metricValue = row.metricValues?.[0].value;
    // check value exist
    if (!metricValue) continue;
    // push data to array
    data.push({ event: eventName, count: Number(metricValue) });
  }
  return res.status(200).json({ success: true, data });
};

export default analytics;
