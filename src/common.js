const keypress = async () => {
  console.log("Press any key to continue...");
  process.stdin.setRawMode(true);
  return new Promise((resolve) =>
    process.stdin.once("data", () => {
      process.stdin.setRawMode(false);
      resolve();
    })
  );
};

module.exports = { keypress };
