import * as React from "react";
import axios from "axios";
import { Button, Text, Navbar, Input, Spacer, Link } from "./components";

export function Navigator() {
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [headline, setHeadline] = React.useState("");

  React.useEffect(() => {
    const URL = "/gui-settings";

    axios
      .get(URL)
      .then((response) => {
        setHeadline(response.data["headline"]);
      })
      .catch((e) => {
        console.dir(e);
      });
  }, []);

  const search = (event) => {
    const value = query.trim(); //remove white spaces
    if (!value) {
      return;
    }
    //OK lets find out the value matches a block/transaction or address

    //Address
    setLoading(true);
    axios.get("/gettype/" + value).then((response) => {
      setLoading(false);
      if (response.data.type === "BLOCK") {
        window.location.href = "index.html?route=BLOCK&hash=" + value;
      }
      if (response.data.type === "TRANSACTION") {
        window.location.href = "index.html?route=TRANSACTION&id=" + value;
      }
      if (response.data.type === "ADDRESS") {
        window.location.href = "index.html?route=ADDRESS&address=" + value;
      }

      if (response.data.type === "UNKNOWN") {
        alert("Sorry, do not know what to do with " + value);
      }
    });
    event.preventDefault();
  };
  const variant = "sticky";
  return (
    <>
      <Navbar isBordered variant="sticky">
        <Navbar.Brand>
          <Navbar.Toggle aria-label="toggle navigation" />
          <Link href="/" css={{ marginLeft: "5px" }}>
            <Text
              size={18}
              css={{
                display: "inline-block",
                textGradient: "45deg, $blue600 -20%, $pink600 50%",
              }}
              weight="bold"
            >
              Rebel Explorer
            </Text>{" "}
            <Text
              size={22}
              css={{
                marginLeft: "2px",
                display: "inline-block",
                textGradient: "45deg, $yellow600 -20%, $red600 100%",
              }}
              weight="bold"
            >
              {headline}
            </Text>
          </Link>
        </Navbar.Brand>

        <div className="navbar-right">
          <Link href="index.html?route=ASSETS">Assets / Tokens</Link>
        </div>

        <Navbar.Collapse>
          <Navbar.CollapseItem>
            <form className="d-flex" role="search" onSubmit={search} style={{ width: "100%" }}>
              <Input
                size="xl"
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
                placeholder="Address / transaction / block id"
              />
            </form>
          </Navbar.CollapseItem>
        </Navbar.Collapse>
      </Navbar>
    </>
  );
}

/*


<Navbar.CollapseItem>
            <form className="d-flex" role="search">
              <Input
                size="xl"
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
                placeholder="Address / transaction / block id"
              />
            </form>
          </Navbar.CollapseItem>
          <Navbar.CollapseItem>
            <Button auto flat as={Link} onClick={search}>
              Search
            </Button>
          </Navbar.CollapseItem>
        </Navbar.Collapse>



        


*/
