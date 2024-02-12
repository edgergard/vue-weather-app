export const convertDate = (timeZone: string) => {
  const currentDateTime = new Date();

  const timeString = currentDateTime.toLocaleString("en-US", {
    timeZone: timeZone,
  });

  const date = timeString.split(",")[0];
  const time = timeString.split(",")[1];

  return { date, time };
};

export const convertTime = (mseconds: number) => {
  const date = new Date(mseconds * 1000);

  const hours = ('0' + date.getHours()).slice(-2);
  const minutes = ('0' + date.getMinutes()).slice(-2); 
  
  return `${hours}:${minutes}`;
};
