import React, { useState, useEffect } from 'react';
import { getSuggestedSchools, School } from '../../services/schoolSuggestionService';

interface SchoolSuggestionTestProps {
  deviceId: string;
}

const SchoolSuggestionTest: React.FC<SchoolSuggestionTestProps> = ({ deviceId }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoading(true);
        setError(null);
        const suggestedSchools = await getSuggestedSchools(deviceId);
        setSchools(suggestedSchools);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (deviceId) {
      fetchSchools();
    }
  }, [deviceId]);

  if (loading) {
    return <div>Loading suggested schools...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (schools.length === 0) {
    return <div>No suggested schools found for this device.</div>;
  }

  return (
    <div>
      <h2>Suggested Schools for Device</h2>
      <ul>
        {schools.map(school => (
          <li key={school.id}>
            <strong>{school.school_name}</strong>
            <div>Match Score: {school.matchScore}%</div>
            {school.distance !== undefined && (
              <div>Distance: {school.distance.toFixed(1)} km</div>
            )}
            <div>Address: {school.address}</div>
            <div>Students: {school.student_count}</div>
            <div>Contact: {school.contact_person} ({school.phone})</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SchoolSuggestionTest;