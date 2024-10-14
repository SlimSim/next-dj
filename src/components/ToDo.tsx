import * as React from "react";

const ToDo = React.forwardRef(() => {
  return (
    <ul className="list-decimal ml-4">
      <li>
        att fixa: att den kan ladda ner och spara låtar som finns på servern,
        ska jag göra detta via backenden kanske? (så att NextJs anropar firebase
        (eller spotify!!!) och skickar låtarna till klienten, som sparar det på
        disk (och där finns ju BÅDE den publika disken, som chrome komemr åt,
        men också en sån där seecret place, som ios kommer åt) eller i
        IndexedDB!)
        <ul className="list-disc ml-4">
          <li>
            denan fil (take me to church) från firebase:
            4ed171cc22759ea60cfe6049f01f0e1b8715e52acbc1b3bffe88acc1c42652a5
          </li>
          <li>
            har denna länk:{" "}
            <a
              target="_blank"
              href="https://firebasestorage.googleapis.com/v0/b/troff-test.appspot.com/o/TroffFiles%2F4ed171cc22759ea60cfe6049f01f0e1b8715e52acbc1b3bffe88acc1c42652a5?alt=media&token=bfc80084-a477-4db6-b587-2ae00e64d5ac"
            >
              länk
            </a>
          </li>
          <li>
            denan fil (Jurassic park) från firebase:
            94b0acbaab70a53cf8ab7a6e81820bfe9fe473b27a819a22e198b480fb5690df
          </li>
          <li>
            har denna länk:{" "}
            <a
              target="_blank"
              href="https://firebasestorage.googleapis.com/v0/b/troff-test.appspot.com/o/TroffFiles%2F94b0acbaab70a53cf8ab7a6e81820bfe9fe473b27a819a22e198b480fb5690df?alt=media&token=24d93957-021c-42d4-ae30-7ae180230b4e"
            >
              Jurassic park
            </a>
          </li>
          <li>
            testa att ladda ner den både till <b>indexedDB</b> OCH till{" "}
            <b>fileSystemAPI</b>
            (hemliga helst!)
          </li>
        </ul>
      </li>
      <li>Att ladda upp låtar från datorn också!</li>
      <li>
        Slå ihop tailwind.config.ts och tailwind.config.js, borde bara behöva en
        eller?
      </li>
    </ul>
  );
});

ToDo.displayName = "ToDo";
export default ToDo;
