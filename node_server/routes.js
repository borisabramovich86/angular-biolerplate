
module.exports = function (app) {

  // server routes ===========================================================
  
  
  // frontend routes =========================================================
  // route to handle all angular requests
  app.get('*', function (req, res) {
    res.sendfile('./build/index.htm');
  });

};