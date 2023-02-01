export const getFieldDisplayName = (name: string) => {
  const res = name.replace(/([A-Z]+)/g, ' $1').replace(/([A-Z][a-z])/g, ' $1');
  return res[0].toLocaleUpperCase() + res.substring(1);
};
