const { secretKeyStripe } = require("./stripe");

const test = async (sourceId) => {
  const retrievedSource = await secretKeyStripe.sources.retrieve(sourceId)
  console.log('retrievedSource: ', retrievedSource)
  await secretKeyStripe.sources.update(sourceId, {amount: 9999})
  const updatedSource = await secretKeyStripe.sources.retrieve(sourceId)
  console.log('updatedSource: ', updatedSource)

};

(async () => {
  await test('src_1HZI0qKy6MGWtC1IGW6LCdYI')
})()
