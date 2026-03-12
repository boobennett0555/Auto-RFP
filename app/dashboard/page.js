const authed = sessionStorage.getItem('rfp_authed')
if (!authed) {
  router.push('/')
  return
}
