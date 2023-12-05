const availabilityText = {
  remote: "• Only accepting full remote position",
  freelance: "• Only accepting freelancing jobs",
  both: "• Only accepting freelancing jobs on full remote position",
};

export const generateAvailabilityStatus = (freelance: boolean, remote: boolean) => {
  const result =
    freelance && remote
      ? availabilityText.both
      : freelance
      ? availabilityText.freelance
      : remote
      ? availabilityText.remote
      : "";
  return result;
};
