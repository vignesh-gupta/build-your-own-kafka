import net from "net";

const arrayToBuffer = (array) => {
  return Buffer.concat([zigZagVarInt(array.length), ...array]);
};
const zigZagVarInt = (number) => {
  if (number === 0) return oneByteToBuffer(0);
  if (number === 1) return oneByteToBuffer(2);
  if (number === 2) return oneByteToBuffer(4);
};
const TAG_BUFFER = zigZagVarInt(0);

function apiVersionResponse(correlationId) {
  let firstSupportedApiVersion = Buffer.concat([
    numberToTwoBytesBigEndian(18),
    numberToTwoBytesBigEndian(4),
    numberToTwoBytesBigEndian(50),
    TAG_BUFFER,
  ]);
  let secondSupportedApiVersion = Buffer.concat([
    numberToTwoBytesBigEndian(8),
    numberToTwoBytesBigEndian(4),
    numberToTwoBytesBigEndian(42),
  ]);
  let timemillisbanane = numberToFourBytesBigEndian(0);
  let tagbuffer = TAG_BUFFER;
  return {
    header: {
      correlationId,
      tagBuffer: [],
    },
    errorCode: 0,
    body: Buffer.concat([
      arrayToBuffer([firstSupportedApiVersion]),
      timemillisbanane,
      tagbuffer,
    ]),
  };
}
function numberToFourBytesBigEndian(number) {
  const buffer = Buffer.alloc(4);
  buffer.writeInt32BE(number);
  return buffer;
}
function numberToTwoBytesBigEndian(number) {
  const buffer = Buffer.alloc(2);
  buffer.writeInt16BE(number);
  return buffer;
}
function oneByteToBuffer(number) {
  const buffer = Buffer.alloc(1);
  buffer.writeInt8(number);
  return buffer;
}
function toResponseV0(data) {
  const messageBuffer = numberToFourBytesBigEndian(data.header);
  const lengthBuffer = numberToFourBytesBigEndian(messageBuffer.length);
  return Buffer.concat([lengthBuffer, messageBuffer]);
}
function toResponseV1(data) {
  const headerBuffer = numberToFourBytesBigEndian(data.header.correlationId);
  const errorBuffer = numberToTwoBytesBigEndian(data.errorCode);
  const bodyBuffer = data.body ? data.body : Buffer.alloc(0);
  console.log(
    "calculating length",
    headerBuffer.length,
    errorBuffer.length,
    bodyBuffer.length
  );
  const lengthBuffer = numberToFourBytesBigEndian(
    headerBuffer.length + errorBuffer.length + bodyBuffer.length
  );
  console.log("the buffers");
  [lengthBuffer, headerBuffer, errorBuffer, bodyBuffer].forEach(
    logBufferInHumanReadableForm
  );
  return Buffer.concat([lengthBuffer, headerBuffer, errorBuffer, bodyBuffer]);
}

function parseRequest(buffer) {
  const length = buffer.readUInt32BE(0);
  const apiKey = buffer.readInt16BE(4);
  const apiVersion = buffer.readInt16BE(6);
  const correlationId = buffer.readInt32BE(8);
  return {
    length,
    header: {
      apiKey,
      apiVersion,
      correlationId,
    },
  };
}

function logBufferInHumanReadableForm(buffer) {
  console.log(buffer.toString("hex"));
  console.log(buffer.toString());
}

function validateRequest(parsedRequest) {
  if (![0, 1, 2, 3, 4].includes(parsedRequest.header.apiVersion)) {
    return { errorCode: 35 };
  }
  return {};
}
const server = net.createServer((connection) => {
  connection.on("data", (data) => {
    const parsedRequest = parseRequest(data);
    const validation = validateRequest(parsedRequest);
    if (validation.errorCode) {
      const errorResponse = {
        header: {
          correlationId: parsedRequest.header.correlationId,
        },
        errorCode: validation.errorCode,
        body: null,
      };
      connection.write(toResponseV1(errorResponse));
      return;
    }
    console.log(JSON.stringify(parsedRequest, null, 2));
    console.log(data.toString());
    let data1 = toResponseV1(
      apiVersionResponse(parsedRequest.header.correlationId)
    );
    logBufferInHumanReadableForm(data1);
    connection.write(data1);
  });
});
server.listen(9092, "127.0.0.1");
