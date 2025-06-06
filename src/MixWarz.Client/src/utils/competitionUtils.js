/**
 * Maps competition status enum names to user-friendly display text
 * @param {string} enumStatus - The enum status name from the backend
 * @returns {string} User-friendly status text
 */
export const getStatusDisplayText = (enumStatus) => {
  switch (enumStatus) {
    case 'OpenForSubmissions':
    case 'VotingRound1Open':
    case 'VotingRound2Open':
      return 'Active';
    case 'Upcoming':
      return 'Upcoming';
    case 'Completed':
    case 'Closed':
    case 'Archived':
      return 'Completed';
    case 'InJudging':
    case 'VotingRound1Setup':
    case 'VotingRound1Tallying':
    case 'VotingRound2Setup':
    case 'VotingRound2Tallying':
    case 'RequiresManualWinnerSelection':
      return 'In Progress';
    case 'Cancelled':
    case 'Disqualified':
      return 'Cancelled';
    default:
      // Return the original enum name if no mapping is found
      return enumStatus;
  }
};

/**
 * Gets the appropriate CSS class or style for a competition status
 * @param {string} enumStatus - The enum status name from the backend
 * @returns {object} Object containing styling information
 */
export const getStatusStyling = (enumStatus) => {
  const displayText = getStatusDisplayText(enumStatus);
  
  switch (displayText) {
    case 'Active':
      return {
        backgroundColor: 'var(--success)',
        color: 'var(--bg-primary)',
        border: 'none'
      };
    case 'Upcoming':
      return {
        backgroundColor: 'var(--warning)',
        color: 'var(--bg-primary)',
        border: 'none'
      };
    case 'In Progress':
      return {
        backgroundColor: 'var(--info)',
        color: 'var(--bg-primary)',
        border: 'none'
      };
    case 'Completed':
      return {
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)'
      };
    case 'Cancelled':
      return {
        backgroundColor: 'var(--danger)',
        color: 'var(--bg-primary)',
        border: 'none'
      };
    default:
      return {
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)'
      };
  }
};

/**
 * Maps user-friendly filter options to backend enum names
 * @param {string} filterStatus - The filter status selected by user
 * @returns {string[]} Array of backend enum names that match the filter
 */
export const mapFilterToEnumNames = (filterStatus) => {
  switch (filterStatus) {
    case 'Active':
      return ['OpenForSubmissions', 'VotingRound1Open', 'VotingRound2Open'];
    case 'Upcoming':
      return ['Upcoming'];
    case 'Completed':
      return ['Completed', 'Closed', 'Archived'];
    case 'In Progress':
      return ['InJudging', 'VotingRound1Setup', 'VotingRound1Tallying', 'VotingRound2Setup', 'VotingRound2Tallying', 'RequiresManualWinnerSelection'];
    default:
      return [];
  }
}; 