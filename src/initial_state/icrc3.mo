import ICRC3 "mo:icrc3-mo";
import Buffer "mo:base/Buffer";

module{
  public let defaultConfig = func(caller: Principal) : ICRC3.InitArgs {
    ?{
          maxActiveRecords = 4000;
          settleToRecords = 2000;
          maxRecordsInArchiveInstance = 1_000_000;
          maxArchivePages  = 62500; //allows up to 993 bytes per record
          archiveIndexType = #Stable;
          maxRecordsToArchive = 10_000;
          archiveCycles = 6_000_000_000_000; //two trillion
          archiveControllers = null;
          supportedBlocks = [];
      }
  };

  public func ensure_block_types(icrc3Class: ICRC3.ICRC3) : () {
    let supportedBlocks = Buffer.fromIter<ICRC3.BlockType>(icrc3Class.supported_block_types().vals());

    let blockequal = func(a : {block_type: Text}, b : {block_type: Text}) : Bool {
      a.block_type == b.block_type;
    };

    if(Buffer.indexOf<ICRC3.BlockType>({block_type = "79subCreate"; url="";}, supportedBlocks, blockequal) == null){
      supportedBlocks.add({
            block_type = "79subCreate"; 
            url="https://github.com/dfinity/ICRC/tree/main/standards/ICRC-79";
          });
    };

    if(Buffer.indexOf<ICRC3.BlockType>({block_type = "79subCancel"; url="";}, supportedBlocks, blockequal) == null){
      supportedBlocks.add({
            block_type = "79subCancel"; 
            url="https://github.com/dfinity/ICRC/tree/main/standards/ICRC-79";
          });
    };

    if(Buffer.indexOf<ICRC3.BlockType>({block_type = "79subStatus"; url="";}, supportedBlocks, blockequal) == null){
      supportedBlocks.add({
            block_type = "79subStatus"; 
            url="https://github.com/dfinity/ICRC/tree/main/standards/ICRC-79";
          });
    };

    if(Buffer.indexOf<ICRC3.BlockType>({block_type = "79payment"; url="";}, supportedBlocks, blockequal) == null){
      supportedBlocks.add({
            block_type = "79payment"; 
            url="https://github.com/dfinity/ICRC/tree/main/standards/ICRC-79";
          });
    };

    icrc3Class.update_supported_blocks(Buffer.toArray(supportedBlocks));
  };
};