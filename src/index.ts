// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const { RunCLI } = await import('./cli')
  await RunCLI()
})()
