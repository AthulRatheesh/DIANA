from configparser import ConfigParser

def config(filename="utils/database.ini", section="postgresql"):
    parser = ConfigParser()
    parser.read(filename)

    if parser.has_section(section):
        return {key: parser.get(section, key) for key in parser.options(section)}
    else:
        raise Exception(f"Section {section} not found in {filename}")

# Optional: Default connection pool settings (can also be elsewhere)
DEFAULT_POOL_SETTINGS = {
    "minconn": 5,
    "maxconn": 20,
}