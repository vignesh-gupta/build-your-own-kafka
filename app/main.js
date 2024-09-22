import net from "net";

// Uncomment this block to pass the first stage
const server = net.createServer((connection) => {
  // Handle connection
  const coorelationID = 7;
  const response = Buffer.from([0,0,0,0,0,0,0,coorelationID]);
  connection.write(response);
});

server.listen(9092, "127.0.0.1");
