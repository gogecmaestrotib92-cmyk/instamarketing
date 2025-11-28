import React from 'react';
import KpiCard, { KpiGrid } from './KpiCard';
import { 
  FiImage, 
  FiFilm, 
  FiTarget, 
  FiCalendar,
  FiTrendingUp 
} from 'react-icons/fi';

/**
 * Example usage of KpiCard component with 5 metrics
 * 
 * Usage in your Dashboard:
 * import KpiCardsExample from '../components/KpiCardsExample';
 * <KpiCardsExample />
 */
const KpiCardsExample = () => {
  // Example data - replace with your actual data
  const metrics = [
    {
      label: 'Total Posts',
      value: '128',
      icon: <FiImage />,
      iconColor: 'blue',
      subtitle: '+12 this month'
    },
    {
      label: 'Total Reels',
      value: '45',
      icon: <FiFilm />,
      iconColor: 'purple',
      subtitle: '+8 this month'
    },
    {
      label: 'Campaigns',
      value: '7',
      icon: <FiTarget />,
      iconColor: 'pink',
      subtitle: '3 active'
    },
    {
      label: 'Scheduled',
      value: '12',
      icon: <FiCalendar />,
      iconColor: 'orange',
      subtitle: 'Next: Tomorrow'
    },
    {
      label: 'Engagement',
      value: '4.2%',
      icon: <FiTrendingUp />,
      iconColor: 'green',
      subtitle: '+0.5% vs last week'
    }
  ];

  return (
    <KpiGrid>
      {metrics.map((metric, index) => (
        <KpiCard
          key={index}
          label={metric.label}
          value={metric.value}
          icon={metric.icon}
          iconColor={metric.iconColor}
          subtitle={metric.subtitle}
        />
      ))}
    </KpiGrid>
  );
};

export default KpiCardsExample;
