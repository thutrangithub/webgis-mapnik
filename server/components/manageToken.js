const jwt = require('jsonwebtoken');
const secretKey = '5bf4d93da580f3cc4c586ca77fa957563c87206c99cc189d3679f3e85bea3e59'; 
class manageToken{
    GenerateToken(uuid){
        return new Promise(async(resolve,reject) =>{
          const user = { id: uuid};
        const payload = {
          user: user,
          timestamp: new Date().getTime(),
        };
        const token = await jwt.sign(payload, secretKey);
        resolve (token)
        })
      }
    verifyToken(token){
        return new Promise((resolve,reject) =>{
            jwt.verify(token.replace('Bearer ', ''), secretKey, (err, decoded) => {
                if (err) {
                  reject(err)
                } else {
                  resolve(decoded)
                }
              })
        })
    }
}
module.exports = manageToken
// app.get('/generate-token', (req, res) => {
//   const user = { id: uuidv4(), username: 'example_user' };
//   const payload = {
//     user: user,
//     timestamp: new Date().getTime(),
//   };
//   const token = jwt.sign(payload, secretKey);
//   res.json({ token });
// });
// app.get('/protected', verifyToken, (req, res) => {
//   res.json({ message: 'Protected route accessed successfully!', user: req.user });
// });
// const port = 3000;
// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });
