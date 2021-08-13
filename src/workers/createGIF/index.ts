const util = require('./util')

worker.onMessage((msg: WorkerParam) => {
  const { type, body } = msg
  switch (type) {
    case 'generate:start':
      try {
        const result = util.ImageArrayToGif(body)
        callMessageBack('generate:done', result)
      } catch (error) {
        callMessageBack('generate:error', [])
      }
      break
    default:
      console.log(msg)
      break
  }
})

function callMessageBack(type: string, data: any) {
  worker.postMessage({
    message: {
      type: type,
      data: data
    },
  })
}