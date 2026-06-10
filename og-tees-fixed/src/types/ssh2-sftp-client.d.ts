// Minimal type declaration for ssh2-sftp-client (no @types package available)
declare module 'ssh2-sftp-client' {
  interface ConnectOptions {
    host: string
    port?: number
    username?: string
    password?: string
    privateKey?: Buffer | string
    passphrase?: string
    readyTimeout?: number
    retries?: number
    retry_factor?: number
    retry_minTimeout?: number
  }

  interface FileInfo {
    type: string // '-' = file, 'd' = directory, 'l' = symlink
    name: string
    size: number
    modifyTime: number
    accessTime: number
    rights: { user: string; group: string; other: string }
    owner: number
    group: number
  }

  class SftpClient {
    constructor(name?: string)
    connect(config: ConnectOptions): Promise<void>
    end(): Promise<void>
    list(remoteFilePath: string, filter?: string | RegExp): Promise<FileInfo[]>
    get(remoteFilePath: string, localPath?: string): Promise<Buffer | string>
    fastGet(
      remoteFilePath: string,
      localPath: string,
      options?: object
    ): Promise<string>
    put(
      localPath: string | Buffer | NodeJS.ReadableStream,
      remoteFilePath: string,
      options?: object
    ): Promise<string>
    exists(remoteFilePath: string): Promise<false | 'd' | '-' | 'l'>
    stat(remoteFilePath: string): Promise<FileInfo>
    mkdir(remoteFilePath: string, recursive?: boolean): Promise<string>
    rmdir(remoteFilePath: string, recursive?: boolean): Promise<string>
    delete(remoteFilePath: string, noErrorOk?: boolean): Promise<string>
    rename(fromPath: string, toPath: string): Promise<string>
  }

  export = SftpClient
}
