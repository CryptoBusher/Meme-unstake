import { format, createLogger, transports} from 'winston';



function buildLogger() {
    const logFormat = format.printf(({ level, message, timestamp, stack}) => {
        return `${timestamp} | ${level} | ${stack || message}`;
    })
    
    return createLogger({
        level: 'info',
        format: format.combine(
            format.colorize(),
            format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
            format.errors({stask: true}),
            logFormat),
        transports: [
            new transports.Console(),
            new transports.File({
                filename: 'logger/botlog.log',
                level: 'debug'
            })
        ]
    });
}


export const logger = buildLogger();
