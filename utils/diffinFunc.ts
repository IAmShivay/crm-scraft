export const calculateDaysAgo = (createdAt: string): number => {
    const createdDate = new Date(createdAt);
    const currentDate = new Date();
    const diffInTime = currentDate.getTime() - createdDate.getTime();
    const diffInDays = Math.floor(diffInTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
    return diffInDays;
  };