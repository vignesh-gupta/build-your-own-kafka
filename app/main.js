import net from "net";

// Uncomment this block to pass the first stage
const server = net.createServer((connection) => {
  connection.on("data", (data) => {
    const request_api_key = data.subarray(0, 2);
    const request_api_version = data.subarray(2, 4);
    const correlation_id = data.subarray(4, 12);

    connection.write(correlation_id);
  });
});

server.listen(9092, "127.0.0.1");
