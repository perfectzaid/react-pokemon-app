import React, { useState, useEffect } from "react";
import "./App.css";

function PokemonCard({ pokemon }) {
  return (
    <div className="pokemon-card">
      <img
        src={pokemon.sprites.front_default}
        alt={pokemon.name}
        className="pokemon-image"
      />
      <h3 className="pokemon-name">
        {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
      </h3>
      <p className="pokemon-id">#{pokemon.id.toString().padStart(3, "0")}</p>
      <div className="pokemon-types">
        {pokemon.types.map((typeInfo) => (
          <span
            key={typeInfo.type.name}
            className={`type-badge type-${typeInfo.type.name}`}
          >
            {typeInfo.type.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function SearchBar({ searchTerm, setSearchTerm }) {
  return (
    <input
      type="text"
      placeholder="Search Pokémon by name..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="search-input"
    />
  );
}

function TypeFilter({ types, selectedType, setSelectedType }) {
  return (
    <select
      value={selectedType}
      onChange={(e) => setSelectedType(e.target.value)}
      className="type-filter"
    >
      <option value="">All Types</option>
      {types.map((type) => (
        <option key={type} value={type}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </option>
      ))}
    </select>
  );
}

function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch first 150 Pokémon basic info
  useEffect(() => {
    async function fetchPokemon() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          "https://pokeapi.co/api/v2/pokemon?limit=150"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch Pokémon list");
        }
        const data = await response.json();

        // Fetch detailed info for each Pokémon in parallel
        const detailedPromises = data.results.map(async (pokemon) => {
          const res = await fetch(pokemon.url);
          if (!res.ok) {
            throw new Error("Failed to fetch Pokémon details");
          }
          return res.json();
        });

        const detailedPokemon = await Promise.all(detailedPromises);
        setPokemonList(detailedPokemon);

        // Extract unique types from all Pokémon
        const allTypes = new Set();
        detailedPokemon.forEach((p) => {
          p.types.forEach((t) => allTypes.add(t.type.name));
        });
        setTypes(Array.from(allTypes).sort());

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    fetchPokemon();
  }, []);

  // Filter Pokémon based on search term and selected type
  useEffect(() => {
    let filtered = pokemonList;

    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType) {
      filtered = filtered.filter((p) =>
        p.types.some((t) => t.type.name === selectedType)
      );
    }

    setFilteredPokemon(filtered);
  }, [pokemonList, searchTerm, selectedType]);

  return (
    <div className="App">
      <header className="app-header">
        <h1>Pokémon Search</h1>
      </header>

      <div className="filters">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <TypeFilter
          types={types}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
        />
      </div>

      {loading && <p className="status-message">Loading Pokémon...</p>}
      {error && <p className="status-message error">Error: {error}</p>}
      {!loading && !error && filteredPokemon.length === 0 && (
        <p className="status-message">No Pokémon found.</p>
      )}

      <div className="pokemon-list">
        {filteredPokemon.map((pokemon) => (
          <PokemonCard key={pokemon.id} pokemon={pokemon} />
        ))}
      </div>
    </div>
  );
}

export default App;
