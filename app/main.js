import net from "net";

// Uncomment this block to pass the first stage
const server = net.createServer((connection) => {
  connection.on("data", (data) => {
    const request_api_key = data.subarray(0, 2);
    const request_api_version = data.subarray(2, 4);
    const correlation_id = data.subarray(4, 12);

    const API_VERSIONS = [0, 1, 2, 3, 4];

    if (API_VERSIONS.includes(request_api_version.readUint16BE(0))) {
      console.log(request_api_version.readUint16BE(0));

      connection.write(correlation_id);
    } else {
      connection.write(correlation_id);
      const buffer = Buffer.alloc(2);
      buffer.writeUint16BE(35);
      connection.write(buffer);
    }

    connection.write(correlation_id);
  });
});

server.listen(9092, "127.0.0.1");
